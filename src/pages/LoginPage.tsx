import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Lock, Mail, User, Wand2, Check, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import logo2 from "../assets/images/logo2.svg";

function getReturnPage(): { page: string; data?: any } {
  try {
    const raw = sessionStorage.getItem("login_return");
    if (raw) {
      sessionStorage.removeItem("login_return");
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return { page: "home" };
}

export function LoginPage() {
  const { signIn, signUp, sendMagicLink, forgotPassword } = useAuth();
  const { navigate } = useRouter();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normalizar email (trim y lowercase)
      const normalizedEmail = loginEmail.trim().toLowerCase();

      if (!normalizedEmail || !loginPassword) {
        setError("Por favor, completa todos los campos");
        setLoading(false);
        return;
      }

      await signIn(normalizedEmail, loginPassword);

      // Redirigir a la página de retorno (checkout, evento, etc.) o home
      const returnTo = getReturnPage();
      setTimeout(() => {
        navigate(returnTo.page as any, returnTo.data);
      }, 100);
    } catch (err: any) {
      console.error('❌ Error en handleLogin:', err);
      // Mostrar mensaje de error más descriptivo
      const errorMessage = err.message || err.error?.message || "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp(signupEmail, signupPassword, signupName);
      const returnTo = getReturnPage();
      navigate(returnTo.page as any, returnTo.data);
    } catch (err: any) {
      setError(err.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMagicLinkSent(false);
    setLoading(true);

    try {
      await sendMagicLink(magicLinkEmail);
      setMagicLinkSent(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace mágico");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLinkSent(false);
    setLoading(true);

    try {
      await forgotPassword(resetEmail);
      setResetLinkSent(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(loginEmail);
    setResetLinkSent(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <img 
                src={logo2} 
                alt="vetlix.com" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">Bienvenido a Veltlix</h1>
            <p className="text-gray-400">Accede a tu cuenta de forma segura</p>
          </div>

          <Card className="border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 shadow-2xl backdrop-blur-sm">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-3 bg-white/5 border border-white/10 h-auto p-1 rounded-lg">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-[#c61619] data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all py-2.5 font-medium rounded-md"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="magic"
                  className="data-[state=active]:bg-[#c61619] data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all py-2.5 font-medium rounded-md"
                >
                  Magic Link
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-[#c61619] data-[state=active]:text-white text-gray-400 hover:text-gray-200 data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all py-2.5 font-medium rounded-md"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {/* Magic Link Tab */}
              <TabsContent value="magic">
                {!magicLinkSent ? (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-5 mb-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 flex-shrink-0">
                          <Wand2 className="h-5 w-5 text-purple-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-200 mb-1">Acceso Rápido y Seguro</p>
                          <p className="text-sm text-purple-300/80 leading-relaxed">
                            Te enviaremos un enlace de acceso único a tu correo electrónico. No necesitas recordar contraseñas.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#c61619] text-white hover:bg-[#a01316] shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          Recibir Enlace de Acceso
                        </span>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
                      El enlace será válido por 60 minutos y te permitirá acceder de forma segura
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-900/30 to-emerald-900/20 p-6 text-center backdrop-blur-sm">
                      <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-2 ring-green-500/30">
                          <Check className="h-8 w-8 text-green-300" />
                        </div>
                      </div>
                      <h3 className="font-bold text-green-200 mb-3 text-lg">
                        ¡Enlace Enviado Exitosamente!
                      </h3>
                      <p className="text-sm text-green-300/90 mb-4 leading-relaxed">
                        Hemos enviado un enlace de acceso seguro a<br />
                        <strong className="text-green-200 font-semibold">{magicLinkEmail}</strong>
                      </p>
                      <div className="rounded-lg bg-white/5 p-3 mb-4">
                        <p className="text-xs text-green-300/80 leading-relaxed">
                          📧 Revisa tu bandeja de entrada<br />
                          🔗 Haz clic en el enlace<br />
                          ✨ Accederás automáticamente a tu cuenta
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        El enlace expira en <strong className="text-green-300">60 minutos</strong>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-white/20 hover:bg-white/10 hover:border-white/30 transition-all"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setMagicLinkEmail("");
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar a otro correo
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#c61619] text-white hover:bg-[#a01316] shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Verificando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        Iniciar Sesión
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Juan Pérez"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres</p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#c61619] text-white hover:bg-[#a01316] shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creando cuenta...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <User className="h-4 w-4" />
                        Crear Cuenta Gratis
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="mt-4 text-center text-sm text-gray-400">
            Al continuar, aceptas nuestros términos y condiciones
          </p>
        </motion.div>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                Recuperar Contraseña
              </DialogTitle>
              <DialogDescription>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </DialogDescription>
            </DialogHeader>
            {!resetLinkSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Enlace"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-800 bg-green-900/20 p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-300 mb-2">
                    ¡Enlace Enviado! ✅
                  </h3>
                  <p className="text-sm text-green-400 mb-4">
                    Hemos enviado un enlace de recuperación a <strong className="text-green-300">{resetEmail}</strong>
                  </p>
                  <p className="text-xs text-green-400">
                    Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 text-xs text-yellow-300">
                  <strong>Nota:</strong> Para que funcione el envío de emails, debes configurar el servicio SMTP en Supabase.
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
