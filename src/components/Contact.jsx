import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const MIN_MESSAGE_CHARS = 10;
// local@domain.tld — no spaces, exactly one @, at least one dot in the domain, TLD of 2+ chars
const EMAIL_PATTERN = /^[^\s@]+@([^\s@.]+\.)+[^\s@.]{2,}$/;
// DOM order of the fields; also the ids of the inputs, so we can focus the first invalid one
const FIELD_ORDER = ['firstName', 'lastName', 'email', 'message', 'permission'];
const INITIAL_FORM = { firstName: '', lastName: '', email: '', message: '', permission: false };

const FIELD_CLASSES =
  "w-full bg-transparent border-b pb-3 text-lg focus:outline-none focus:border-red-600 transition-colors placeholder-white/40 font-medium rounded-none text-white";

// Pure validation: trims text before checking and returns { fieldId: 'message' } for each invalid field.
const validate = (values) => {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Please enter your first name.';
  }
  if (!values.lastName.trim()) {
    errors.lastName = 'Please enter your last name.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address, like name@example.com.';
  }

  const message = values.message.trim();
  if (!message) {
    errors.message = 'Please enter a message.';
  } else if (message.replace(/\s/g, '').length < MIN_MESSAGE_CHARS) {
    errors.message = `Your message needs at least ${MIN_MESSAGE_CHARS} characters (spaces don't count).`;
  }

  if (!values.permission) {
    errors.permission = 'Please tick the box to give permission to contact you.';
  }

  return errors;
};

// The icon and the text carry the error, so it never relies on colour alone. The icon is hidden from screen readers.
const FieldError = ({ id, message }) =>
  message ? (
    <p id={`${id}-error`} className="mt-3 flex items-start gap-2 text-xs font-mono text-red-400">
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  ) : null;

const Contact = () => {
  const ref = useRef(null);
  
  // React Form State tracking
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errors, setErrors] = useState({}); // { fieldId: message } — only populated after a submit attempt
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  // Parallax translation for the big background text
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "20%"]);

  // Re-check one field and show or clear just its message
  const revalidateField = (id, values) => {
    const fieldError = validate(values)[id];
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) next[id] = fieldError;
      else delete next[id];
      return next;
    });
  };

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const nextData = { ...formData, [id]: type === 'checkbox' ? checked : value };
    setFormData(nextData);

    // Editing after a successful send puts the button back to "Send Message"
    if (status === 'sent') setStatus('idle');

    // After a failed submit, update messages live: fields already showing an error (and the checkbox) re-check on change
    if (submitAttempted && (type === 'checkbox' || errors[id])) {
      revalidateField(id, nextData);
    }
  };

  // After a failed submit, also re-check a field when the user leaves it
  const handleBlur = (e) => {
    if (submitAttempted) revalidateField(e.target.id, formData);
  };

  // Handle form submission logic — validates first, then sends the message straight to Anoop's email via FormSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    setSubmitAttempted(true);
    const nextErrors = validate(formData);
    setErrors(nextErrors);

    const firstInvalid = FIELD_ORDER.find((id) => nextErrors[id]);
    if (firstInvalid) {
      setStatus('idle');
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    // Trim what the user typed before sending it
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    setStatus('sending');

    try {
      const res = await fetch("https://formsubmit.co/ajax/aniopyadav7379@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          email,
          message,
          _subject: "New message from portfolio site"
        })
      });

      if (!res.ok) throw new Error("Send failed");

      setStatus('sent');
      setFormData(INITIAL_FORM);
      setErrors({});
      setSubmitAttempted(false);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // aria wiring shared by every field: invalid state + link to its message (only when a message exists)
  const a11yProps = (id) => ({
    'aria-invalid': errors[id] ? 'true' : 'false',
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
    onBlur: handleBlur
  });
  const underline = (id) => (errors[id] ? 'border-red-500' : 'border-white/20');

  return (
    <section ref={ref} id="contact" className="bg-[#0b0b0b] w-full min-h-screen relative overflow-hidden flex items-end pt-32 pb-0 border-t border-white/10 select-none">
      
      {/* Background Cinematic Red Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Huge Background Parallax Netflix Watermark Text */}
      <motion.div 
        style={{ y }}
        className="absolute top-0 left-0 w-full h-full flex flex-col justify-start items-center overflow-hidden pointer-events-none z-0 pt-16 md:pt-12 opacity-10"
      >
        <h1 
          className="text-[25vw] leading-[0.75] font-black text-red-600 uppercase tracking-tighter select-none scale-y-[1.6] origin-top"
          style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
        >
          CONTACT
        </h1>
      </motion.div>

      {/* Form Card Overlay */}
      <div className="relative z-10 w-full flex justify-end items-end">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-[#141414]/95 backdrop-blur-2xl border-t border-l border-white/15 w-full md:w-[90%] lg:w-[82%] p-8 md:p-16 text-white flex flex-col justify-between rounded-tl-[3rem] shadow-[0_-25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
        >
          {/* Subtle internal top crimson highlight glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-90"></div>

          <div className="flex items-center justify-between mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-red-600/10 border border-red-600/30 text-xs font-mono uppercase tracking-widest text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>EPISODE 04 // GET IN TOUCH</span>
            </div>
            <span className="text-xs font-mono text-white/40 tracking-wider hidden md:block">
              // LET'S BUILD SOMETHING CINEMATIC
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12 md:gap-16 w-full">
            <div className="flex flex-col md:flex-row gap-12 md:gap-20 w-full">
              
              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-10">
                <div className="relative">
                  <label htmlFor="firstName" className="sr-only">First name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name" 
                    required
                    {...a11yProps('firstName')}
                    className={`${FIELD_CLASSES} ${underline('firstName')}`}
                  />
                  <FieldError id="firstName" message={errors.firstName} />
                </div>
                <div className="relative">
                  <label htmlFor="lastName" className="sr-only">Last name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name" 
                    required
                    {...a11yProps('lastName')}
                    className={`${FIELD_CLASSES} ${underline('lastName')}`}
                  />
                  <FieldError id="lastName" message={errors.lastName} />
                </div>
                <div className="relative">
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address" 
                    required
                    {...a11yProps('email')}
                    className={`${FIELD_CLASSES} ${underline('email')}`}
                  />
                  <FieldError id="email" message={errors.email} />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 flex flex-col">
                <div className="relative h-full flex flex-col">
                  <label htmlFor="message" className="sr-only">Message</label>
                  <textarea 
                    id="message" 
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message here..." 
                    required
                    {...a11yProps('message')}
                    className={`flex-1 min-h-[140px] ${FIELD_CLASSES} ${underline('message')} resize-none`}
                  ></textarea>
                  <FieldError id="message" message={errors.message} />
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col md:flex-row gap-12 mt-4 pt-6 border-t border-white/10">
              {/* Left text */}
              <div className="flex-1">
                <div className="flex items-start gap-4 text-sm font-light text-white/70">
                  <input 
                    type="checkbox" 
                    id="permission" 
                    checked={formData.permission}
                    onChange={handleChange}
                    required
                    {...a11yProps('permission')}
                    className="mt-1 w-4 h-4 rounded-sm border-white/30 bg-transparent text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                    style={{ accentColor: "#E50914" }}
                  />
                  <label htmlFor="permission" className="cursor-pointer max-w-[280px] leading-snug">
                    I give permission to contact me at this email address.
                  </label>
                </div>
                <FieldError id="permission" message={errors.permission} />
              </div>

              {/* Right text & button */}
              <div className="flex-1 flex flex-col gap-8 text-xs text-white/50 font-light">
                <p className="leading-relaxed max-w-[400px]">
                  This site is protected by security protocols and industry-standard privacy guidelines.
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                  <p className="max-w-[250px] leading-relaxed">
                    Ready to start a project or collaboration? Send a direct signal.
                  </p>
                  
                  <button 
                    type="submit" 
                    disabled={status === 'sending'}
                    className="px-8 py-3.5 rounded bg-red-600 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-red-700 transition-all duration-300 group whitespace-nowrap shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Message Sent ✓' : 'Send Message'}
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                {/* Live regions stay mounted so screen readers announce changes. While empty, -mt-8 cancels the parent's gap-8 so layout is unchanged. */}
                <div className={status === 'sent' || status === 'error' ? '' : '-mt-8'}>
                  <div role="status">
                    {status === 'sending' && <p className="sr-only">Sending your message…</p>}
                    {status === 'sent' && (
                      <p className="text-xs text-green-500 font-mono">Thanks! Your message has been sent — I'll get back to you soon.</p>
                    )}
                  </div>
                  <div role="alert">
                    {status === 'error' && (
                      <p className="text-xs text-red-500 font-mono">
                        <span aria-hidden="true">⚠ </span>Something went wrong sending your message — please email me directly at aniopyadav7379@gmail.com.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>

        </motion.div>
      </div>
    </section>
  );
};

export default Contact;