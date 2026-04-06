import { t } from '../i18n.js';

export function initHelpModal(container) {
  let modalOverlay = null;

  function render() {
    if (modalOverlay) return; // already rendered

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay help-modal-backdrop';
    
    // Use styling similar to existing modals
    modalOverlay.innerHTML = `
      <div class="modal-content help-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>${t('help.title') || 'Raccourcis Clavier'}</h2>
          <button class="btn btn-ghost btn-close-help" aria-label="Close">×</button>
        </div>
        <div class="modal-body" style="padding-top: 1rem;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <tbody>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>↑</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Sélectionner le compartiment parent</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>↓</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Sélectionner le premier sous-compartiment</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>←</kbd> / <kbd>→</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Naviguer entre les compartiments voisins</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>Ctrl</kbd> + <kbd>Z</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Annuler (Undo)</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>Ctrl</kbd> + <kbd>Maj</kbd> + <kbd>Z</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Refaire (Redo)</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;"><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #333;">Forcer la sauvegarde</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-close-help-footer">Fermer</button>
        </div>
      </div>
    `;

    container.appendChild(modalOverlay);

    const closeHandler = () => close();

    modalOverlay.querySelector('.btn-close-help').addEventListener('click', closeHandler);
    modalOverlay.querySelector('.btn-close-help-footer').addEventListener('click', closeHandler);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeHandler();
    });
  }

  function open() {
    if (!modalOverlay) {
      render();
    }
    modalOverlay.classList.add('open');
    modalOverlay.style.display = 'flex';
  }

  function close() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      modalOverlay.style.display = 'none';
    }
  }

  // Bind Escape key to close the modal if open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
      close();
    }
  });

  return { open, close };
}
