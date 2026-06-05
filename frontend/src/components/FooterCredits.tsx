import { Github, Mail } from "lucide-react";

export default function FooterCredits() {
  return (
    <footer className="relative z-10 w-full px-4 pb-36 md:px-8 md:pb-40">
      <div className="rounded-[24px] border border-white/8 bg-stone-950/60 px-6 py-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Contacto y repositorio */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/70">
              FosteriaVTT
            </p>
            <a
              href="mailto:fosteriavtt@gmail.com"
              className="flex items-center gap-2 text-sm text-stone-400 transition hover:text-amber-300"
            >
              <Mail size={14} />
              fosteriavtt@gmail.com
            </a>
            <a
              href="https://github.com/luisemmanuelchavezm/fosteriaVTT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-400 transition hover:text-amber-300"
            >
              <Github size={14} />
              github.com/luisemmanuelchavezm/fosteriaVTT
            </a>
          </div>

          {/* Agradecimientos */}
          <div className="space-y-1.5 md:text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/70">
              Agradecimientos especiales
            </p>
            <p className="text-sm text-stone-400">
              A la comunidad de Discord{" "}
              <span className="font-semibold text-stone-300">
                D1RolibianPeople
              </span>{" "}
              por las sugerencias y el apoyo al proyecto.
            </p>
            <p className="text-sm text-stone-400">
              A mi tutora de TFG, por la guía y el acompañamiento.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
