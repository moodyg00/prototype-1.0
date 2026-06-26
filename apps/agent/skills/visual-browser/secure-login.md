# Secure Login Skill

## When to Use
- The current page shows a login form (username/email + password fields).
- The task requires accessing authenticated areas ("behind login", "user authentication", subdirectories requiring auth).
- After navigation to a site that redirects to login.

## Secure Rules (NEVER VIOLATE)
- In thoughts and JSON outputs: Use only high-level language. Examples:
  - "Perform secure login for the current domain using stored credentials."
  - "Type username into email field, then password into password field using secure store."
- NEVER output, echo, or include the actual username or password in any message sent to the xAI API.
- The execution layer (this server) will securely inject the real values from the encrypted store only when performing the browser action.
- Prefer loading a previously saved session (cookies) if available for the domain — this avoids re-entering credentials entirely.
- After successful login, the session state will be saved automatically for future tasks on the same domain.

## Recommended Flow (clean sequence)
The interactive obs now provides reliable copyable CSS selectors (e.g. `input[type="text"][name="email"] Email or mobile number [filled] ; input[type="password"][name="pass"] Password`).
Copy the `input[type=...][name=...]` part as the selector value.

1. Email visible, no [filled]: type marker using the email CSS selector from obs. The JSON object **must** contain the property `"recommend_specialist": "login"`.
2. Next obs (email [filled]): type marker using the password CSS selector from obs.
3. Both [filled]: click the Log in button (use button text or its CSS from obs).
4. Verify form gone + logged-in homepage visible (screenshots are auto-captured on content changes for your "screenshot of my page" task).
5. Only then action "done" + final_answer.

**Good step 1:**
```json
{"thought": "Email not [filled]. Type marker on email CSS.", "action": "type", "selector": "input[type=\"text\"][name=\"email\"]", "text": "perform secure login for the current domain using stored credentials", "recommend_specialist": "login"}
```

**Good step 2:**
```json
{"thought": "Email [filled]. Type marker on password CSS.", "action": "type", "selector": "input[type=\"password\"][name=\"pass\"]", "text": "perform secure login for the current domain using stored credentials", "recommend_specialist": "login"}
```

**Good step 3 (submit):**
```json
{"thought": "Fields filled. Click Log in.", "action": "click", "selector": "button[name=\"login\"]", "recommend_specialist": "login"}
```

Rules:
- `"recommend_specialist": "login"` must be a real property in the JSON (thoughts mentioning it are ignored by the driver).
- Never emit final_answer on type or click.
- If ANY obs contains "no credentials in store" (or "Secure marker ... could not be resolved"), the *next* output must be action:"done" (no more type/click) + final_answer exactly like: "I reached the login form but the secure store has no credentials saved for [exact-domain-from-obs, e.g. accounts.google.com]. Please open the Secure Logins section, fill Domain + Username + Password for '[exact-domain]', click 'Save for domain', then re-run this exact task." Do not loop.
- Use [filled] + the CSS strings from obs to advance the sequence without repeating fills on the same field.

The driver injects the stored values server-side only on the marker. This is the clean required flow.