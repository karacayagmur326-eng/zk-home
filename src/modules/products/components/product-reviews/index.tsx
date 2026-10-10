"use client"
import { useSiteContact } from "@components/common/SellerQuestion"

import { useUrlState } from "@lib/hooks/use-url-state"

import { MessageSquare, Star, CheckCircle, ShieldCheck, Image as ImageIcon, X, Send, HelpCircle, Loader2 } from "@lib/icons"
import { FormEvent, useEffect, useMemo, useState, useRef } from "react"

type ReviewItem = {
  id?: string | number
  author: string
  rating: number
  comment: string
  date?: string
  image_url?: string
  type?: string
  answer?: string
}

export default function ProductReviews({
  productId,
  layout = "full",
}: {
  productId: string
  layout?: "full" | "column"
}) {
  const siteContact = useSiteContact()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [questions, setQuestions] = useState<ReviewItem[]>([])
  const [activeTab, setActiveTab] = useUrlState<"reviews" | "questions">("reviews", "reviews_tab", ["reviews", "questions"], false)
  
  // Form State
  const [formType, setFormType] = useState<"review" | "question">("review")
  const [author, setAuthor] = useState("")
  const [email, setEmail] = useState("")
  const [comment, setComment] = useState("")
  const [userRating, setUserRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Validation & Submission Status
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setFormType(activeTab === "questions" ? "question" : "review") }, [activeTab])

  // 2-Way Synchronization Helper
  const selectMode = (mode: "review" | "question") => {
    setFormType(mode)
    setActiveTab(mode === "question" ? "questions" : "reviews")
    setErrorMessage("")
    setSuccessMessage("")
  }

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews) setReviews(data.reviews)
        if (data?.questions) setQuestions(data.questions)
      })
      .catch(() => undefined)

    // Listen to hash changes for #degerlendir and #sorular
    const handleHash = (event?: Event) => {
      const hash = event instanceof CustomEvent ? `#${event.detail}` : window.location.hash
      if (hash === "#sorular") {
        selectMode("question")
      } else if (hash === "#degerlendir") {
        selectMode("review")
      }
    }
    handleHash()
    window.addEventListener("hashchange", handleHash)
    window.addEventListener("product:section", handleHash)
    return () => {
      window.removeEventListener("hashchange", handleHash)
      window.removeEventListener("product:section", handleHash)
    }
  }, [productId])

  // Calculate average rating
  const average = useMemo(() => {
    return reviews.length
      ? reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length
      : 5.0
  }, [reviews])

  // Handle Photo File Upload / Preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImagePreview(base64)
        setImageUrl(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove Photo
  const handleRemovePhoto = () => {
    setImagePreview(null)
    setImageUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Form Submit Handler with Strict Validations
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    // 1. Author Name Check (Min 3 Chars)
    if (author.trim().length < 3) {
      setErrorMessage("Ad Soyad alanına en az 3 karakter girmelisiniz.")
      return
    }

    // 2. Email Check (Valid Format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Lütfen geçerli bir e-posta adresi yazınız.")
      return
    }

    // 3. Comment Length Check (Min 10 Chars)
    if (comment.trim().length < 10) {
      setErrorMessage(
        formType === "question"
          ? "Soru metniniz en az 10 karakter olmalıdır."
          : "Yorumunuz en az 10 karakter olmalıdır."
      )
      return
    }

    setStatus("sending")

    const payload = {
      type: formType,
      author: author.trim(),
      email: email.trim(),
      comment: comment.trim(),
      rating: formType === "review" ? userRating : 5,
      image_url: imageUrl || undefined,
    }

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.item) {
        if (formType === "question") {
          selectMode("question")
        } else {
          setReviews((prev) => [data.item, ...prev])
          selectMode("review")
        }

        setComment("")
        handleRemovePhoto()
        setStatus("success")
        setSuccessMessage(data.message || "İşleminiz başarıyla kaydedildi!")
        setTimeout(() => setStatus("idle"), 4000)
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Gönderilirken bir hata oluştu.")
      }
    } catch {
      setStatus("error")
      setErrorMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* ── 1. UNIFIED FORM CARD (ON TOP) ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 w-full">
        <div>
          {/* Single Unified Header Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <button
              type="button"
              onClick={() => selectMode("review")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                formType === "review"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Yorum & Puan</span>
            </button>

            <button
              type="button"
              onClick={() => selectMode("question")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                formType === "question"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Soru & Cevap</span>
            </button>
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900">
            {formType === "question" ? "Satıcıya Soru Sor" : "Değerlendirme Yap"}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {formType === "question"
              ? "Ürün hakkında merak ettiklerinizi doğrudan teknik ekibimize sorun."
              : "Deneyimlerinizi ve fotoğraflarınızı diğer müşterilerle paylaşın."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selector (Only for Review) */}
          {formType === "review" && (
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                Ürün Puanınız <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} yıldız ver`}
                    aria-pressed={userRating === star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating || userRating)
                          ? "fill-[#C98484] text-[#A95E5E]"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-black text-slate-800 ml-2">
                  {hoverRating || userRating} / 5 Yıldız
                </span>
              </div>
            </div>
          )}

          {/* Ad Soyad Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
              <span>Adınız Soyadınız <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-500 font-normal">En az 3 karakter</span>
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-100 shadow-2xs transition-all placeholder:text-slate-500"
            />
          </div>

          {/* E-posta Input */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
              <span>E-posta Adresiniz <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-500 font-normal">Yayınlanmaz</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-100 shadow-2xs transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Comment / Question Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">
                {formType === "question" ? "Sorunuz" : "Yorumunuz"} <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[10.5px] font-bold ${
                  comment.trim().length < 10 ? "text-amber-800" : "text-emerald-700"
                }`}
              >
                {comment.trim().length} / min 10 karakter
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                formType === "question"
                  ? "Ürün hakkında sormak istediğiniz detaylı soruyu buraya yazın..."
                  : "Ürünün kalitesi, kullanımı ve kargo deneyiminiz hakkında detaylar..."
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-100 shadow-2xs transition-all placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Photo Upload Attachment Section (For Reviews) */}
          {formType === "review" && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>Fotoğraf Ekle (İsteğe Bağlı)</span>
                <span className="text-[10px] text-slate-500 font-normal">Görsel Seçin</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-upload-input"
              />

              {imagePreview ? (
                <div className="relative inline-block border-2 border-[#C98484] rounded-xl overflow-hidden p-1 bg-white">
                  <img
                    src={imagePreview}
                    alt="Yüklenen önizleme"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload-input"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-600 hover:border-[#C98484] hover:text-[#A95E5E] hover:bg-rose-50/50 transition-all cursor-pointer w-full justify-center"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>Ürün Fotoğrafı Yükle</span>
                </label>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 animate-in fade-in">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 animate-in fade-in flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full h-11 rounded-xl bg-primary text-white text-xs font-black shadow-md hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{formType === "question" ? "Soruyu Gönder" : "Yorumu Yayınla"}</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── 2. PUBLISHED LIST SECTION (UNDER THE FORM) ── */}
      <section className="space-y-4 w-full">
        {/* Reviews Mode Display */}
        {formType === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                <span>Yayınlanan Değerlendirmeler</span>
                <span className="bg-rose-100 text-[#A95E5E] text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              </h4>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs font-extrabold text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-[#C98484] text-[#A95E5E]" />
                  <span>{average.toFixed(1)} / 5.0</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800">Henüz değerlendirme yapılmamış</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Bu ürün hakkında ilk deneyiminizi yukarıdaki formdan fotoğraflı yorum yaparak paylaşabilirsiniz!
                </p>
              </div>
            ) : (
              reviews.map((r, i) => (
                <div
                  key={r.id || i}
                  className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">{r.author}</span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> Doğrulanmış
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{r.date || "Bugün"}</span>
                  </div>

                  {/* Stars */}
                  <div className="flex text-[#A95E5E]">
                    {[...Array(5)].map((_, sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-3.5 h-3.5 ${
                          sIdx < (r.rating || 5)
                            ? "fill-[#C98484] text-[#A95E5E]"
                            : "fill-slate-200 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{r.comment}</p>

                  {/* Photo Attachment */}
                  {r.image_url && (
                    <div className="pt-1">
                      <img
                        src={r.image_url}
                        alt="Yorum görseli"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(r.image_url, "_blank")}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Questions Mode Display */}
        {formType === "question" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                <span>Sorulan Sorular</span>
                <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {questions.length}
                </span>
              </h4>
            </div>

            {questions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                <HelpCircle className="w-7 h-7 text-slate-300 mx-auto" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800">Henüz soru sorulmamış</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Ürün hakkında merak ettiğiniz bir detayı yukarıdaki formdan satıcıya sorabilirsiniz!
                </p>
              </div>
            ) : (
              questions.map((q, i) => (
                <div
                  key={q.id || i}
                  className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">{q.author}</span>
                      <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/80">
                        Ürün Sorusu
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{q.date || "Bugün"}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    Soru: {q.comment}
                  </p>

                  {/* Admin Answer Box */}
                  {q.answer ? (
                    <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#A95E5E]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{siteContact.brandName} Mağaza Cevabı</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {q.answer}
                      </p>
                    </div>
                  ) : (
                    <span className="inline-block text-[11px] text-slate-500 italic">
                      Cevap bekleniyor...
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  )
}
