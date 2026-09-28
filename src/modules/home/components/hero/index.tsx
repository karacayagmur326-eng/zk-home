import { Github } from "@lib/icons";
import { Button, Heading } from "@modules/common/components/ui";
const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-industrial overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-0"></div>
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center lg:p-32 gap-6 text-white">
        <span className="flex flex-col gap-4">
          <Heading
            level="h1"
            className="text-4xl md:text-6xl leading-tight text-white font-semibold tracking-tight normal-case"
          >
            Profesyonel<br/>
            <span className="text-primary">Çözümler</span>
          </Heading>
          <Heading
            level="h2"
            className="text-lg md:text-2xl leading-8 text-gray-300 font-medium max-w-2xl mx-auto"
          >
            Yeni ürünler ve içerikler hazırlanıyor. ZK Home çok yakında hizmetinizde.
          </Heading>
        </span>
        <a href="/store" className="mt-4">
          <Button className="bg-primary hover:bg-primary-hover border-none text-white px-8 py-4 text-lg font-bold uppercase rounded-sm shadow-lg hover:-translate-y-1 transition-transform">
            Ürünleri İncele
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Hero;
