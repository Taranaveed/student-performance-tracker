import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import bannerImg from '../assets/chand-bagh-banner.png';
import schoolLogo from '../assets/chand-bagh-logo.png';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        <img
          src={bannerImg}
          alt="Chand Bagh School – Jilani Block"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/70" />
        <div className="relative z-10 flex flex-col items-center text-center px-10">
          <img
            src={schoolLogo}
            alt="Chand Bagh School crest"
            className="w-24 h-24 rounded-full border-4 border-white/30 shadow-2xl mb-6"
          />
          <h1 className="text-3xl font-bold text-white tracking-wide">Chand Bagh School</h1>
          <p className="text-blue-200 text-sm mt-1 font-medium tracking-widest uppercase">Jilani Block</p>
          <div className="w-16 h-px bg-white/30 my-5" />
          <p className="text-white/80 text-base font-medium">Student Performance Portal</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img
              src={schoolLogo}
              alt="Chand Bagh School"
              className="w-16 h-16 rounded-full border-2 border-blue-200 shadow mb-3"
            />
            <h1 className="text-xl font-bold text-blue-900">Chand Bagh School</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-500 mt-1 text-sm">We&apos;ll email you a secure reset link</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
