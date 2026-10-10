import { careerMissions, canUseFinish, FINISHES, type Career, type FinishId } from './progression';
import { careerSeal } from './career-art';
import { feedbackDraftKey, validateFeedback, type FeedbackPayload, type FeedbackKind } from './feedback';
interface PanelOptions {
  career: () => Career; setFinish: (id: FinishId) => void; owner: () => string;
  context: () => { map: string; wave: number; version: string; width: number; height: number; quality: string; fps: number; touch: boolean };
  account: () => { username: string } | null;
  submit: (payload: FeedbackPayload) => Promise<void>;
  pause: () => () => void;
}
export function createFeaturePanels(options: PanelOptions) {
  const root = document.createElement('div'); root.id = 'featureOverlay'; root.hidden = true; document.body.append(root);
  let restore: (() => void) | null = null, previous: HTMLElement | null = null;
  const close = () => { root.hidden = true; root.replaceChildren(); restore?.(); restore = null; previous?.focus({ preventScroll: true }); };
  const open = (title: string, body: string) => {
    if (root.hidden) { previous = document.activeElement as HTMLElement; restore = options.pause(); }
    root.hidden = false;
    root.innerHTML = `<section class="feature-panel" role="dialog" aria-modal="true" aria-label="${title}"><header><div><span class="feature-eyebrow">BASTION / FIELD JOURNAL</span><h1>${title}</h1></div><button class="feature-close" aria-label="Close ${title}">×</button></header>${body}<footer><button class="ov-btn2 feature-return">RETURN</button></footer></section>`;
    root.querySelector<HTMLButtonElement>('.feature-close')!.onclick = close;
    root.querySelector<HTMLButtonElement>('.feature-return')!.onclick = close;
    root.querySelector<HTMLButtonElement>('.feature-close')!.focus({ preventScroll: true });
  };
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')).filter(el => el.getClientRects().length);
    const first = nodes[0], last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  });
  const showCareer = () => {
    const career = options.career(), missions = careerMissions(career), earned = missions.filter(m => m.value >= m.goal).length;
    open('COMMANDER JOURNAL', `<div class="career-hero"><div class="career-medal">✦</div><div><strong>${earned}<small> / ${missions.length} HONORS</small></strong><p>Every journey counts. Your honors survive a new game.</p><span>${options.account() ? 'SAVED ON THIS DEVICE · GOOGLE SYNC' : 'GUEST CAREER · SAVED ON THIS DEVICE'}</span></div></div>
      <h2>MISSIONS & HONORS</h2><div class="mission-grid">${missions.map(m => {
        const complete = m.value >= m.goal, value = Math.min(m.value, m.goal);
        return `<article class="mission ${complete ? 'earned' : ''}"><span class="mission-emblem" aria-hidden="true">${complete ? '✦' : '◇'}</span><div><h3>${m.name}</h3><p>${m.desc}</p><div class="mission-progress"><i style="width:${value / m.goal * 100}%"></i></div><small>${complete ? 'EARNED' : `${value} / ${m.goal}`}</small></div></article>`;
      }).join('')}</div><h2>FOUNDATION INSIGNIA</h2><p class="feature-note">Earned engravings apply to every tower. They give no combat bonus.</p><div class="finish-grid">${FINISHES.map(f => {
        const unlocked = canUseFinish(career, f.id), seal = careerSeal(f.id), mission = missions.find(m => m.id === f.mission);
        return `<button class="finish-card ${f.id === career.finish ? 'selected' : ''}" data-finish="${f.id}" aria-pressed="${f.id === career.finish}" ${unlocked ? '' : 'disabled'} style="--finish:${f.color}">${seal ? `<img alt="" src="${seal.toDataURL()}">` : '<span class="finish-original" aria-hidden="true">◇</span>'}<b>${f.name}</b><small>${unlocked ? f.id === career.finish ? 'EQUIPPED' : f.desc : `LOCKED · ${mission?.name}`}</small></button>`;
      }).join('')}</div>`);
    root.querySelectorAll<HTMLButtonElement>('[data-finish]').forEach(button => button.onclick = () => {
      const id = button.dataset.finish as FinishId; if (!canUseFinish(options.career(), id)) return;
      options.setFinish(id); showCareer(); root.querySelector<HTMLButtonElement>(`[data-finish="${id}"]`)?.focus({ preventScroll: true });
    });
  };
  const showFeedback = () => {
    const owner = options.owner(), key = feedbackDraftKey(owner), account = options.account();
    let draft: { id?: string; message?: string; kind?: FeedbackKind; rating?: number; diagnostics?: boolean } = {};
    try { draft = JSON.parse(localStorage.getItem(key) || '{}'); } catch { /* Corrupt drafts start empty. */ }
    let id = typeof draft.id === 'string' && /^[A-Za-z0-9_-]{10,80}$/.test(draft.id) ? draft.id : crypto.randomUUID(), attempted = false;
    open('FIELD FEEDBACK', `<p class="feature-note">Help shape the next update. Report a bug, discuss balance, or share an idea.</p><form id="feedbackForm"><div class="feedback-row"><label>CATEGORY<select id="feedbackKind"><option value="bug">BUG / CONTROLS</option><option value="balance">BALANCE / DIFFICULTY</option><option value="idea">IDEA / OTHER</option></select></label><label>YOUR EXPERIENCE<select id="feedbackRating"><option value="5">5 — Loved it</option><option value="4">4 — Enjoyed it</option><option value="3">3 — Mixed</option><option value="2">2 — Needs work</option><option value="1">1 — Frustrating</option></select></label></div><label class="feedback-message">YOUR MESSAGE<textarea id="feedbackText" maxlength="1500" minlength="10" rows="6" required placeholder="What happened? What would you change?" dir="auto"></textarea></label><span id="feedbackCount" class="feedback-count"></span><label class="feedback-consent"><input id="feedbackDiagnostics" type="checkbox"> Include screen size, graphics quality, FPS and touch support to help diagnose issues</label><p class="feature-note">Your player ID, map, wave and game version accompany the report. Your email is not added.</p><p id="feedbackStatus" class="feature-status" role="status" aria-live="polite">${account ? 'The developer receives your report privately.' : 'Sign in with Google from the main menu to send. You can keep or download a draft now.'}</p><div class="feedback-actions"><button class="ov-btn" type="submit" id="feedbackSend" ${account ? '' : 'disabled'}>SEND FEEDBACK</button><button class="ov-btn2" type="button" id="feedbackDownload">DOWNLOAD DRAFT</button></div></form>`);
    const text = root.querySelector<HTMLTextAreaElement>('#feedbackText')!, kind = root.querySelector<HTMLSelectElement>('#feedbackKind')!, rating = root.querySelector<HTMLSelectElement>('#feedbackRating')!, diagnostics = root.querySelector<HTMLInputElement>('#feedbackDiagnostics')!, status = root.querySelector<HTMLElement>('#feedbackStatus')!;
    text.value = typeof draft.message === 'string' ? draft.message.slice(0, 1500) : '';
    kind.value = ['bug','balance','idea'].includes(draft.kind || '') ? draft.kind! : 'bug';
    rating.value = String(draft.rating && draft.rating >= 1 && draft.rating <= 5 ? draft.rating : 4); diagnostics.checked = draft.diagnostics === true;
    const keep = () => {
      if (attempted) { id = crypto.randomUUID(); attempted = false; }
      let saved = true;
      try { localStorage.setItem(key, JSON.stringify({ id, message: text.value, kind: kind.value, rating: +rating.value, diagnostics: diagnostics.checked })); }
      catch { saved = false; status.textContent = 'Device storage is unavailable. Download your draft before closing.'; }
      root.querySelector('#feedbackCount')!.textContent = `${text.value.length} / 1500 · ${saved ? 'DRAFT SAVED ON THIS DEVICE' : 'DOWNLOAD TO KEEP YOUR DRAFT'}`;
    };
    text.oninput = keep; kind.onchange = keep; rating.onchange = keep; diagnostics.onchange = keep; keep();
    const payload = (): FeedbackPayload => {
      const context = options.context();
      return validateFeedback({ id, kind: kind.value as FeedbackKind, rating: +rating.value, message: text.value, createdAt: Date.now(), username: options.account()?.username || 'Guest', version: context.version, map: context.map, wave: context.wave,
        ...(diagnostics.checked ? { diagnostics: { width: context.width, height: context.height, quality: context.quality, fps: context.fps, touch: context.touch } } : {}) });
    };
    root.querySelector<HTMLFormElement>('#feedbackForm')!.onsubmit = async e => {
      e.preventDefault(); const send = root.querySelector<HTMLButtonElement>('#feedbackSend')!;
      if (!options.account() || owner !== options.owner()) { status.textContent = 'Your account changed. Reopen this form before sending.'; return; }
      let report: FeedbackPayload; try { report = payload(); } catch (error) { status.textContent = (error as Error).message; return; }
      attempted = true;
      send.disabled = true; text.readOnly = true; kind.disabled = rating.disabled = diagnostics.disabled = true; status.textContent = 'Sending your report…';
      try { await options.submit(report); try { localStorage.removeItem(key); } catch { /* Report already safely stored. */ } status.textContent = 'REPORT RECEIVED — thank you for helping improve BASTION.'; send.textContent = 'REPORT RECEIVED'; }
      catch (error) { status.textContent = `${(error as Error).message} Your draft is kept. Retry when connected.`; send.disabled = false; text.readOnly = false; kind.disabled = rating.disabled = diagnostics.disabled = false; }
    };
    root.querySelector<HTMLButtonElement>('#feedbackDownload')!.onclick = () => {
      let report: FeedbackPayload; try { report = payload(); } catch (error) { status.textContent = (error as Error).message; return; }
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })), link = document.createElement('a');
      link.href = url; link.download = 'bastion-feedback.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  };
  return { showCareer, showFeedback, close, isOpen: () => !root.hidden };
}
