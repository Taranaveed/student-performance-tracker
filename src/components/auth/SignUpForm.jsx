import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Shield, ChevronDown, X, UserPlus, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import { ROLE_LABELS, HOUSES, GRADES, MAX_TEACHER_CLASSES } from '../../config/marksSystem';

const HOUSE_ROLES   = ['housemaster', 'housemistress'];
const SUBJECT_ROLES = ['teacher'];

export function SignUpForm() {
  const navigate = useNavigate();

  // ── Form fields ───────────────────────────────────────────────────────────
  const [name,              setName]              = useState('');
  const [email,             setEmail]             = useState('');
  const [password,          setPassword]          = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');
  const [role,              setRole]              = useState('teacher');
  const [houseAssignment,   setHouseAssignment]   = useState('');
  const [subjectAssignment, setSubjectAssignment] = useState('');
  const [assignedClasses,   setAssignedClasses]   = useState([]);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [showPassword,      setShowPassword]      = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  // 'signup'    → normal new-account form
  // 'add-role'  → email already exists; ask for existing password to add role
  const [step,           setStep]           = useState('signup');
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const dropdownRef = useRef(null);

  const needsHouse   = HOUSE_ROLES.includes(role);
  const needsSubject = SUBJECT_ROLES.includes(role);
  const needsClasses = role === 'teacher';

  // Close class dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleClass = (grade) => {
    setAssignedClasses(prev => {
      if (prev.includes(grade)) return prev.filter(g => g !== grade);
      if (prev.length >= MAX_TEACHER_CLASSES) return prev;
      return [...prev, grade];
    });
  };

  // ── Step 1: Normal sign-up ────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6)          { setError('Password must be at least 6 characters'); return; }
    if (needsClasses && assignedClasses.length === 0) { setError('Please assign at least one class.'); return; }

    setLoading(true);
    setError('');

    try {
      const { importResult } = await authService.signUp(email, password, {
        name,
        role,
        houseAssignment:   needsHouse   ? houseAssignment   : null,
        subjectAssignment: needsSubject ? subjectAssignment : null,
        assignedClasses:   needsClasses ? assignedClasses   : [],
      });

      if (importResult?.imported > 0) {
        const label = importResult.type === 'class'
          ? `class ${importResult.assignment.toUpperCase()}`
          : `${importResult.assignment} House`;
        setSuccessMessage(`Roster auto-populated with ${importResult.imported} students from ${label}.`);
        setTimeout(() => navigate('/'), 2500);
      } else {
        navigate('/');
      }
    } catch (err) {
      // Email already in use → offer to add this role to the existing account
      if (err.code === 'auth/email-already-in-use') {
        setError('');
        setStep('add-role');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Add role to existing account ──────────────────────────────────
  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter your existing account password.'); return; }
    if (needsClasses && assignedClasses.length === 0) { setError('Please assign at least one class.'); return; }

    setLoading(true);
    setError('');

    try {
      // Sign in to verify ownership and get the uid
      const firebaseUser = await authService.login(email, password);

      const roleExtras = {
        ...(needsHouse   ? { houseAssignment }   : {}),
        ...(needsSubject ? { subjectAssignment }  : {}),
        ...(needsClasses ? { assignedClasses }    : {}),
      };

      await authService.addRoleToAccount(firebaseUser.uid, role, roleExtras);

      setSuccessMessage(`"${ROLE_LABELS[role]}" role added to your account! Redirecting…`);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Failed to add role');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared field section (role, conditionals) ─────────────────────────────
  const RoleFields = () => (
    <>
      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role to Add</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select value={role} onChange={e => { setRole(e.target.value); setAssignedClasses([]); }}
            className="input-field pl-10 appearance-none">
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* House Assignment */}
      {needsHouse && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">House Assignment</label>
          <select value={houseAssignment} onChange={e => setHouseAssignment(e.target.value)}
            required className="input-field">
            <option value="">Select house...</option>
            {HOUSES.map(h => <option key={h} value={h}>{h} House</option>)}
          </select>
        </div>
      )}

      {/* Subject */}
      {needsSubject && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input type="text" value={subjectAssignment} onChange={e => setSubjectAssignment(e.target.value)}
            className="input-field" placeholder="e.g. English, Mathematics" />
        </div>
      )}

      {/* Multi-class dropdown */}
      {needsClasses && (
        <div ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Assigned Classes</label>
            {assignedClasses.length > 0 && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                assignedClasses.length >= MAX_TEACHER_CLASSES ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {assignedClasses.length} / {MAX_TEACHER_CLASSES}
              </span>
            )}
          </div>

          <button type="button" onClick={() => setClassDropdownOpen(prev => !prev)}
            className="input-field w-full flex items-center justify-between text-left">
            {assignedClasses.length === 0 ? (
              <span className="text-gray-400">Select classes…</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignedClasses.map(g => (
                  <span key={g} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {g.toUpperCase()}
                    <span role="button" tabIndex={-1}
                      onMouseDown={ev => { ev.stopPropagation(); toggleClass(g); }}
                      className="hover:text-blue-900 cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </span>
                ))}
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {classDropdownOpen && (
            <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden z-20 relative">
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                {GRADES.map(g => {
                  const selected = assignedClasses.includes(g);
                  const disabled = !selected && assignedClasses.length >= MAX_TEACHER_CLASSES;
                  return (
                    <button key={g} type="button" disabled={disabled} onClick={() => toggleClass(g)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                        selected ? 'bg-blue-50 text-blue-700 font-medium'
                          : disabled ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span>Grade {g.toUpperCase()}</span>
                      {selected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {assignedClasses.length >= MAX_TEACHER_CLASSES && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600">
                  Maximum {MAX_TEACHER_CLASSES} classes reached
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">Each class gets its own tab in the Marks Tracker.</p>
        </div>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'add-role') {
    return (
      <form onSubmit={handleAddRole} className="space-y-5">

        {/* Add-role context banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <UserPlus className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Account already exists for this email</p>
            <p className="mt-0.5 text-blue-700">
              An account exists for <strong>{email}</strong>. Enter your password below to verify ownership,
              then choose the additional role you'd like to add.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{successMessage}</div>
        )}

        {/* Password to verify ownership */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Existing Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} required value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pl-10 pr-10" placeholder="Enter your current password" />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Role + conditionals */}
        <RoleFields />

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" />
          {loading ? 'Adding Role…' : `Add ${ROLE_LABELS[role]} Role`}
        </button>

        <button type="button" onClick={() => { setStep('signup'); setError(''); setPassword(''); }}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Back to sign up
        </button>
      </form>
    );
  }

  // ── Default: sign-up form ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSignUp} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{successMessage}</div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="input-field pl-10" placeholder="John Smith" />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="input-field pl-10" placeholder="user@school.edu" />
        </div>
      </div>

      {/* Role + conditionals */}
      <RoleFields />

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type={showPassword ? 'text' : 'password'} required value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field pl-10 pr-10" placeholder="Min 6 characters" />
          <button type="button" onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
        <input type="password" required value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="input-field" placeholder="••••••••" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
      </p>
    </form>
  );
}
