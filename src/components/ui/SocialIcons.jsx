import React from 'react';

export function InstagramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
}

export function YoutubeIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  );
}

export function TiktokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.3-.776.978-.952 1.178-.175.2-.351.225-.651.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.462.132-.611.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.232-.244-.588-.492-.508-.676-.517l-.576-.01c-.2 0-.526.075-.801.375-.276.3-1.052 1.028-1.052 2.508 0 1.48 1.077 2.909 1.227 3.109.15.2 2.12 3.238 5.136 4.542.717.31 1.277.496 1.713.634.72.229 1.376.196 1.895.119.578-.086 1.78-.727 2.031-1.429.25-.702.25-1.303.175-1.428-.075-.126-.275-.201-.576-.351zM12.04 21.802c-1.764 0-3.493-.474-5.006-1.371l-.359-.213-3.722.976.993-3.628-.233-.371a9.76 9.76 0 0 1-1.498-5.187c0-5.405 4.397-9.803 9.805-9.803 2.618 0 5.078 1.02 6.929 2.871a9.749 9.749 0 0 1 2.87 6.932c0 5.406-4.398 9.804-9.779 9.804zm8.314-18.118A11.722 11.722 0 0 0 12.04 0C5.399 0 .006 5.394 0 12.037a11.7 11.7 0 0 0 1.606 5.922L0 24l6.19-1.624a11.745 11.745 0 0 0 5.85 1.547h.005c6.64 0 12.035-5.394 12.04-12.038 0-3.218-1.253-6.243-3.531-8.52z" />
    </svg>
  );
}
