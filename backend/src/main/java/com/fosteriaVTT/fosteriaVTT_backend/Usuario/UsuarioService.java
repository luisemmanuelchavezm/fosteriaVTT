package com.fosteriaVTT.fosteriaVTT_backend.Usuario;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void deleteUser(Long userId) {

        // ── 1. Chat en campañas del DM ─────────────────────────────────────────────
        em.createQuery("DELETE FROM Chat c WHERE c.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 2. Nullify nullable Chat references to user's jugador/personaje ────────
        em.createQuery("UPDATE Chat c SET c.jugador = NULL WHERE c.jugador.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("UPDATE Chat c SET c.personaje = NULL WHERE c.personaje.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 3. Posicion → personajes del usuario ───────────────────────────────────
        em.createQuery("DELETE FROM Posicion p WHERE p.personaje.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 4. Árbol Capa/Pestaña de campañas del DM ──────────────────────────────
        em.createQuery("DELETE FROM Punto pt WHERE pt.dibujo.capa.pestaña.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Dibujo d WHERE d.capa.pestaña.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Posicion p WHERE p.capa.pestaña.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Capa c WHERE c.pestaña.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Pestaña p WHERE p.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 5. Jugadores en las campañas del DM (otros usuarios) ──────────────────
        em.createQuery("DELETE FROM Jugador j WHERE j.campaña.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 6. Membresías del usuario como jugador en otras campañas ──────────────
        em.createQuery("DELETE FROM Jugador j WHERE j.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 7. Campañas del DM ─────────────────────────────────────────────────────
        em.createQuery("DELETE FROM Campaña c WHERE c.dm.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 8. Hijos de Personaje ──────────────────────────────────────────────────
        em.createQuery("DELETE FROM Mochila m WHERE m.personaje.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Estadistica e WHERE e.personaje.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createNativeQuery(
                        "DELETE FROM personaje_habilidad WHERE personaje_id IN " +
                        "(SELECT id FROM personajes WHERE usuario_id = :uid)")
                .setParameter("uid", userId).executeUpdate();

        // ── 9. Personajes del usuario ──────────────────────────────────────────────
        em.createQuery("DELETE FROM Personaje p WHERE p.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 10. Mapa: desvincular Capas y borrar ───────────────────────────────────
        em.createQuery("UPDATE Capa c SET c.mapa = NULL WHERE c.mapa.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Mapa m WHERE m.usuario.id = :uid")
                .setParameter("uid", userId).executeUpdate();

        // ── 11. Usuario ────────────────────────────────────────────────────────────
        em.createQuery("DELETE FROM Usuario u WHERE u.id = :uid")
                .setParameter("uid", userId).executeUpdate();
    }
}
