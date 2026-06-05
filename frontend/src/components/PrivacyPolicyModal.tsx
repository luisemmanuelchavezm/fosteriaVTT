import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({
  isOpen,
  onClose,
}: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-400/20 bg-stone-950 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 shrink-0">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
            Política de Privacidad
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-stone-300 text-sm leading-relaxed">
          <p className="text-stone-400 text-xs">
            Última actualización: junio de 2026
          </p>

          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de los datos personales recogidos a
              través de
              <strong className="text-stone-100"> FosteriaVTT</strong> es el
              equipo administrador de Fosteria. Para cualquier consulta
              relacionada con el tratamiento de tus datos puedes contactarnos en{" "}
              <a
                href="mailto:fosteriavtt@gmail.com"
                className="text-amber-400/70 hover:text-amber-300 underline"
              >
                fosteriavtt@gmail.com
              </a>
              .
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>
              Al registrarte y usar FosteriaVTT recopilamos los siguientes
              datos:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-stone-400">
              <li>
                <span className="text-stone-300">Nombre de usuario</span>
              </li>
              <li>
                <span className="text-stone-300">
                  Dirección de correo electrónico
                </span>
              </li>
              <li>
                <span className="text-stone-300">
                  Contraseña (almacenada cifrada, nunca en texto plano)
                </span>
              </li>
              <li>
                <span className="text-stone-300">
                  Imagen de perfil (avatar), almacenada en Cloudinary
                </span>
              </li>
              <li>
                <span className="text-stone-300">
                  Contenido generado: personajes, campañas, fichas de juego y
                  mensajes de chat
                </span>
              </li>
            </ul>
          </Section>

          <Section title="3. Finalidad y base legal del tratamiento">
            <p>
              Tratamos tus datos con las siguientes finalidades y bases legales:
            </p>
            <ul className="mt-2 space-y-2 list-disc list-inside text-stone-400">
              <li>
                <span className="text-stone-300">Prestación del servicio</span>{" "}
                — gestionar tu cuenta, personajes y campañas. Base legal:
                ejecución de un contrato (Art. 6.1.b RGPD).
              </li>
              <li>
                <span className="text-stone-300">Mejora de la plataforma</span>{" "}
                — análisis de uso para corregir errores y mejorar funciones.
                Base legal: interés legítimo (Art. 6.1.f RGPD).
              </li>
              <li>
                <span className="text-stone-300">
                  Comunicaciones del servicio
                </span>{" "}
                — envío de correos relacionados con tu cuenta (recuperación de
                contraseña). Base legal: ejecución de un contrato.
              </li>
            </ul>
          </Section>

          <Section title="4. Conservación de los datos">
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa en
              FosteriaVTT. Si eliminas tu cuenta, todos tus datos personales y
              contenido asociado se eliminan de forma permanente e irreversible
              de nuestros sistemas en el momento de la solicitud.
            </p>
          </Section>

          <Section title="5. Destinatarios y terceros">
            <p>
              Tus datos pueden ser compartidos con los siguientes encargados de
              tratamiento, con los que mantenemos los acuerdos de protección de
              datos pertinentes:
            </p>
            <ul className="mt-2 space-y-2 list-disc list-inside text-stone-400">
              <li>
                <span className="text-stone-300">
                  Cloudinary (Cloudinary Ltd.)
                </span>{" "}
                — almacenamiento de imágenes de perfil y recursos de la
                plataforma.{" "}
                <a
                  href="https://cloudinary.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/70 hover:text-amber-300 underline"
                >
                  Política de privacidad de Cloudinary
                </a>
              </li>
              <li>
                <span className="text-stone-300">
                  Render (Render Services, Inc.)
                </span>{" "}
                — alojamiento del servidor backend.{" "}
                <a
                  href="https://render.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/70 hover:text-amber-300 underline"
                >
                  Política de privacidad de Render
                </a>
              </li>
              <li>
                <span className="text-stone-300">Neon (Neon Inc.)</span> —
                alojamiento de la base de datos.{" "}
                <a
                  href="https://neon.tech/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/70 hover:text-amber-300 underline"
                >
                  Política de privacidad de Neon
                </a>
              </li>
            </ul>
            <p className="mt-2">
              No vendemos ni cedemos tus datos a terceros con fines comerciales.
            </p>
          </Section>

          <Section title="6. Tus derechos">
            <p>
              De acuerdo con el RGPD y la LOPDGDD, tienes los siguientes
              derechos:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-stone-400">
              <li>
                <span className="text-stone-300">Acceso</span> — consultar qué
                datos tenemos sobre ti.
              </li>
              <li>
                <span className="text-stone-300">Rectificación</span> — corregir
                datos inexactos.
              </li>
              <li>
                <span className="text-stone-300">Supresión</span> — solicitar el
                borrado de tus datos («derecho al olvido»).
              </li>
              <li>
                <span className="text-stone-300">Portabilidad</span> — recibir
                tus datos en formato estructurado.
              </li>
              <li>
                <span className="text-stone-300">Oposición y limitación</span> —
                oponerte a determinados tratamientos.
              </li>
            </ul>
            <p className="mt-2">
              Puedes ejercer tus derechos de acceso, rectificación y supresión
              directamente desde tu perfil en la plataforma. Para el resto,
              escríbenos a{" "}
              <a
                href="mailto:fosteriavtt@gmail.com"
                className="text-amber-400/70 hover:text-amber-300 underline"
              >
                fosteriavtt@gmail.com
              </a>
              .
            </p>
            <p className="mt-2">
              Si consideras que el tratamiento no cumple con la normativa,
              puedes presentar una reclamación ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/70 hover:text-amber-300 underline"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>
              .
            </p>
          </Section>

          <Section title="7. Menores de edad">
            <p>
              FosteriaVTT no está dirigida a menores de{" "}
              <strong className="text-stone-100">16 años</strong>. De acuerdo
              con el artículo 8 del RGPD, los menores de esa edad requieren el
              consentimiento de sus tutores legales. Si detectamos que un menor
              ha proporcionado sus datos sin consentimiento, procederemos a
              eliminarlos de inmediato.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus
              datos: cifrado de contraseñas mediante un algoritmo de hash
              seguro, autenticación basada en tokens de sesión, comunicaciones
              cifradas a través de HTTPS y acceso restringido a la base de
              datos.
            </p>
          </Section>

          <Section title="9. Almacenamiento local">
            <p>
              FosteriaVTT utiliza el{" "}
              <strong className="text-stone-100">
                almacenamiento local del navegador
              </strong>{" "}
              (localStorage) para guardar tu sesión activa (token de
              autenticación, nombre de usuario e imagen de perfil). Este
              almacenamiento es estrictamente necesario para el funcionamiento
              de la plataforma y no se utiliza con fines publicitarios ni de
              seguimiento.
            </p>
          </Section>

          <Section title="10. Modificaciones de esta política">
            <p>
              Podemos actualizar esta política de privacidad para reflejar
              cambios legales o en el funcionamiento del servicio. Te
              notificaremos de cambios significativos mediante un aviso en la
              plataforma o por correo electrónico.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-amber-800/60 hover:bg-amber-700 text-white text-sm font-bold border border-amber-600/30 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
        {title}
      </h3>
      <div className="text-stone-400">{children}</div>
    </div>
  );
}
