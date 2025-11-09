import { useState } from "react";
import { useRouter } from "../components/common/Router";
import { useLanguage } from "../hooks/useLanguage";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function ContactPage() {
  const { navigate } = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío del formulario
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Limpiar formulario después de 3 segundos
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>{t("contact.page.title")} | Tiquetera</title>
        <meta name="description" content={t("contact.page.description")} />
      </Helmet>

      {/* Header */}
      <div className="border-b border-white/20 bg-black/95 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="gap-2 !text-white hover:!bg-white/10 hover:!text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#c61619]/20 via-black to-black py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c61619]/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              {t("contact.hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8">
              {t("contact.hero.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#c61619]/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#c61619]/20 group-hover:bg-[#c61619]/30 transition-all">
                    <Mail className="h-6 w-6 text-[#c61619]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {t("contact.info.email")}
                    </h3>
                    <a
                      href="mailto:contacto@tiquetera.com"
                      className="text-white/70 hover:text-[#c61619] transition-colors"
                    >
                      contacto@tiquetera.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#c61619]/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#c61619]/20 group-hover:bg-[#c61619]/30 transition-all">
                    <Phone className="h-6 w-6 text-[#c61619]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {t("contact.info.phone")}
                    </h3>
                    <a
                      href="tel:+1234567890"
                      className="text-white/70 hover:text-[#c61619] transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#c61619]/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#c61619]/20 group-hover:bg-[#c61619]/30 transition-all">
                    <MapPin className="h-6 w-6 text-[#c61619]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {t("contact.info.location")}
                    </h3>
                    <p className="text-white/70">
                      {t("contact.info.address")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#c61619]/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#c61619]/20 group-hover:bg-[#c61619]/30 transition-all">
                    <Clock className="h-6 w-6 text-[#c61619]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {t("contact.info.hours")}
                    </h3>
                    <div className="space-y-1 text-sm text-white/70">
                      <p>{t("contact.info.hours.weekdays")}</p>
                      <p>{t("contact.info.hours.weekends")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#c61619]/20 to-[#c61619]/5 border border-[#c61619]/30">
              <div className="flex items-start gap-4">
                <MessageSquare className="h-6 w-6 text-[#c61619] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("contact.faq.title")}
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    {t("contact.faq.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-[#c61619] !text-[#c61619] hover:!bg-[#c61619] hover:!text-white transition-all"
                  >
                    {t("contact.faq.button")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="p-6 md:p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {t("contact.form.title")}
                </h2>
                <p className="text-white/70">
                  {t("contact.form.subtitle")}
                </p>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {t("contact.form.success.title")}
                  </h3>
                  <p className="text-white/70">
                    {t("contact.form.success.message")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      {t("contact.form.name")} *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t("contact.form.name.placeholder")}
                      className="border-white/20 bg-black/50 text-white placeholder:text-white/40 focus:border-[#c61619] h-12"
                    />
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        {t("contact.form.email")} *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("contact.form.email.placeholder")}
                        className="border-white/20 bg-black/50 text-white placeholder:text-white/40 focus:border-[#c61619] h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">
                        {t("contact.form.phone")}
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t("contact.form.phone.placeholder")}
                        className="border-white/20 bg-black/50 text-white placeholder:text-white/40 focus:border-[#c61619] h-12"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white">
                      {t("contact.form.subject")} *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t("contact.form.subject.placeholder")}
                      className="border-white/20 bg-black/50 text-white placeholder:text-white/40 focus:border-[#c61619] h-12"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">
                      {t("contact.form.message")} *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("contact.form.message.placeholder")}
                      rows={6}
                      className="border-white/20 bg-black/50 text-white placeholder:text-white/40 focus:border-[#c61619] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-[#c61619] to-[#a01316] hover:from-[#a01316] hover:to-[#8a1113] text-white font-semibold transition-all shadow-lg hover:shadow-[#c61619]/50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t("contact.form.sending")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {t("contact.form.submit")}
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-white/50 text-center">
                    {t("contact.form.required")}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

