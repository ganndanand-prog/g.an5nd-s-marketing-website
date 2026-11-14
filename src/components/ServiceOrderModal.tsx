import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import { submitRequestToBackend, EmailPayload } from '../utils/emailSender';
import { saveSubmission, upsertSubmissionInCache } from '../utils/submissionsStorage';

interface ServiceOrderModalProps {
  isOpen: boolean;
  initialService: string;
  onClose: () => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  initialService,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState(initialService);
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setService(initialService);
      setStatusType('idle');
      setStatusMessage('');
    }
  }, [isOpen, initialService]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;

    setIsSubmitting(true);
    setStatusType('idle');
    setStatusMessage('');

    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    const trimmedService = service.trim();
    const trimmedMessage = message.trim();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact);

    const emailPayload: EmailPayload = {
      type: trimmedService ? 'service' : 'contact',
      subject: trimmedService
        ? `[Анандын Вэбсайт] Шинэ захиалга: ${trimmedService} (${trimmedName})`
        : `[Анандын Вэбсайт] Холбоо барих хүсэлт: ${trimmedName}`,
      typeTitle: trimmedService ? 'Үйлчилгээ захиалга' : 'Шууд холбоо барих',
      senderName: trimmedName,
      email: isEmail ? trimmedContact : '',
      phone: !isEmail ? trimmedContact : '',
      contact: trimmedContact,
      service: trimmedService || undefined,
      message: trimmedMessage || (trimmedService ? `Үйлчилгээ захиалга: ${trimmedService}` : '-'),
    };

    try {
      const result = await submitRequestToBackend(emailPayload);

      if (result.success) {
        if (result.submission) {
          upsertSubmissionInCache(result.submission);
        } else {
          saveSubmission({
            type: trimmedService ? 'service' : 'contact',
            senderName: trimmedName,
            email: emailPayload.email || trimmedContact,
            phone: emailPayload.phone || trimmedContact,
            service: trimmedService || undefined,
            message: emailPayload.message,
            emailDelivered: result.emailDelivered,
          });
        }

        setStatusType('success');
        setStatusMessage('Баярлалаа! Удахгүй холбогдоно.');
        setName('');
        setContact('');
        setMessage('');
      } else {
        setStatusType('error');
        setStatusMessage('Алдаа гарлаа, дахин оролдоно уу.');
      }
    } catch {
      setStatusType('error');
      setStatusMessage('Алдаа гарлаа, дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-sky-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {initialService ? 'Үйлчилгээ захиалах' : 'Холбоо барих'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Мэдээллээ бөглөхөд Gmail болон Discord руу зэрэг илгээгдэнэ.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Хаах"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {statusType === 'success' ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                {statusMessage}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Таны хүсэлтийг хүлээн авлаа. Тун удахгүй эргэн холбогдох болно.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Хаах
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Нэр <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Жишээ: Батболд"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Холбоо барих (Утас эсвэл Email) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Жишээ: 9911**** эсвэл name@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Үйлчилгээ
                </label>
                <input
                  type="text"
                  name="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Сонгосон үйлчилгээ (заавал биш)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Нэмэлт мэдээлэл
                </label>
                <textarea
                  name="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Төслийн тухай болон хүсэж буй дэлгэрэнгүй мэдээллээ бичнэ үү..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {statusType === 'error' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Илгээж байна...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Илгээх</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
