/**
 * MEMÓRIA · Memory card — where the QR on the bottle lands.
 * The customer shares what the scent reminds them of and receives a personal,
 * single-use 10% code for their next order (created by submit_memory() in the
 * database; the browser never decides the discount).
 */
import { rpc, backendConfigured } from '../data/backend.js';
import { cart } from '../store/cart.js';
import { setSeo } from '../seo.js';

const today = () => new Date().toISOString().slice(0, 10);

export default {
  title: 'Your memory — MEMÓRIA',
  render() {
    return `
    <section class="container memorycard">
      <header class="memorycard__head">
        <p class="label" data-reveal>The memory card</p>
        <h1 data-reveal>What does it remind you&nbsp;of?</h1>
        <p class="memorycard__lede" data-reveal>A place, a person, a love, a summer you never forgot. Write it down — and we’ll keep <strong>10% off</strong> your next bottle.</p>
      </header>

      <form class="memorycard__form" data-memory-form novalidate data-reveal>
        <div class="field field--full">
          <label for="mc-memory">Your memory</label>
          <textarea id="mc-memory" name="memory" rows="4" required minlength="2" maxlength="1000"
            placeholder="It smells like my grandmother’s balcony in Heliopolis…"></textarea>
          <span class="field__error">Tell us what MEMÓRIA reminds you of.</span>
        </div>
        <div class="field">
          <label for="mc-name">Your name</label>
          <input id="mc-name" name="name" autocomplete="name" required minlength="2" maxlength="120" />
          <span class="field__error">Please enter your name.</span>
        </div>
        <div class="field">
          <label for="mc-phone">Mobile</label>
          <input id="mc-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="01X XXXX XXXX"
            pattern="[+0-9 \\-]{10,17}" />
          <span class="field__error">Please enter an Egyptian mobile number, e.g. 010 1234 5678.</span>
        </div>
        <div class="field">
          <label for="mc-birth">Date of birth</label>
          <input id="mc-birth" name="birth_date" type="date" autocomplete="bday" required min="1900-01-01" max="${today()}" />
          <span class="field__error">Please enter your date of birth.</span>
        </div>
        <p class="memorycard__error" data-form-error role="alert" hidden></p>
        <button class="btn btn--primary btn--block" type="submit" data-submit>Keep my memory</button>
        <p class="memorycard__fine">One card per mobile number. Your details stay with MEMÓRIA.</p>
      </form>

      <div class="memorycard__done" data-done hidden tabindex="-1">
        <p class="label">Your memory is kept</p>
        <h2>Thank you<span data-done-name></span>.</h2>
        <p class="memorycard__lede">Here is 10% off your next order — one use, entered at checkout.</p>
        <div class="memorycard__code">
          <span class="stamp">Your code</span>
          <strong data-code></strong>
          <button class="btn btn--small" type="button" data-copy>Copy code</button>
        </div>
        <p class="memorycard__fine">We’ve also saved it in your bag on this phone.</p>
        <a class="btn btn--primary btn--block" href="/shop" data-continue>Continue to MEMÓRIA</a>
      </div>
    </section>`;
  },
  mount(root) {
    setSeo({
      title: 'Your memory — MEMÓRIA',
      description: 'Tell us what MEMÓRIA reminds you of and get 10% off your next order.',
      path: '/memory',
    });
    const form = root.querySelector('[data-memory-form]');
    const done = root.querySelector('[data-done]');
    const errorBox = root.querySelector('[data-form-error]');
    const submit = root.querySelector('[data-submit]');
    const fieldOf = { name: 'name', phone: 'phone', birth_date: 'birth_date', memory: 'memory' };

    const showError = (msg, field) => {
      errorBox.hidden = false;
      errorBox.textContent = msg;
      if (field && form[fieldOf[field]]) {
        form[fieldOf[field]].closest('.field').classList.add('has-error');
        form[fieldOf[field]].focus();
      }
    };

    form.querySelectorAll('input, textarea').forEach((el) =>
      el.addEventListener('input', () => el.closest('.field').classList.remove('has-error'))
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      let firstBad = null;
      form.querySelectorAll('input, textarea').forEach((el) => {
        const bad = !el.checkValidity() || (el.required && !el.value.trim());
        el.closest('.field').classList.toggle('has-error', bad);
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        firstBad.focus();
        return;
      }
      if (!backendConfigured) {
        showError('The memory card isn’t connected yet. Please try again later.');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Keeping your memory…';
      try {
        const res = await rpc('submit_memory', {
          p_name: form.name.value,
          p_phone: form.phone.value,
          p_birth_date: form.birth_date.value,
          p_memory: form.memory.value,
        });
        if (!res?.ok) {
          showError(res?.error || 'Something went wrong. Please try again.', res?.field);
          return;
        }
        cart.setCode(res.code);
        root.querySelector('[data-code]').textContent = res.code;
        const first = form.name.value.trim().split(/\s+/)[0];
        root.querySelector('[data-done-name]').textContent = first ? `, ${first}` : '';
        if (res.existing) root.querySelector('[data-done] .memorycard__lede').textContent = 'You already have a memory card — here is your code again. One use, entered at checkout.';
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        showError('We couldn’t reach MEMÓRIA just now. Please check your connection and try again.');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Keep my memory';
      }
    });

    root.querySelector('[data-copy]').addEventListener('click', async (e) => {
      const code = root.querySelector('[data-code]').textContent;
      try {
        await navigator.clipboard.writeText(code);
        e.currentTarget.textContent = 'Copied';
      } catch {
        /* clipboard blocked — the code is on screen */
      }
    });
  },
};

