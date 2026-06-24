import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { authService } from '../../services/authService';
import { ROLE_LABELS, HOUSES, GRADES } from '../../config/marksSystem';

const HOUSE_ROLES = ['housemaster', 'housemistress', 'assistantHousemaster', 'houseTeam'];
const SUBJECT_ROLES = ['teacher'];
const CLASS_ROLES = ['teacher'];

export function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [houseAssignment, setHouseAssignment] = useState('');
  const [subjectAssignment, setSubjectAssignment] = useState('');
  const [classAssignment, setClassAssignment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const needsHouse   = HOUSE_ROLES.includes(role);
  const needsSubject = SUBJECT_ROLES.includes(role);
  const needsClass   = CLASS_ROLES.includes(role);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError('');

    try {
      const { importResult } = await authService.signUp(email, password, {
        name,
        role,
        houseAssignment: needsHouse   ? houseAssignment   : null,
        subjectAssignment: needsSubject ? subjectAssignment : null,
        classAssignment: needsClass   ? classAssignment   : null,
      });

      if (importResult && importResult.imported > 0) {
        const label = importResult.type === 'class'
          ? `class ${importResult.assignment}`
          : `${importResult.assignment} House`;
        setSuccessMessage(`Roster auto-populated with ${importResult.imported} students from ${label}.`);
        setTimeout(() => navigate('/'), 2500);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select value={role} onChange={e => setRole(e.target.value)}
            className="input-field pl-10 appearance-none">
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional: House Assignment */}
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

      {/* Conditional: Subject */}
      {needsSubject && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input type="text" value={subjectAssignment} onChange={e => setSubjectAssignment(e.target.value)}
            className="input-field" placeholder="e.g. English, Mathematics" />
        </div>
      )}

      {/* Conditional: Class */}
      {needsClass && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Class</label>
          <select value={classAssignment} onChange={e => setClassAssignment(e.target.value)}
            className="input-field">
            <option value="">Select class...</option>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
      )}

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type={showPassword ? 'text' : 'password'} required value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field pl-10 pr-10" placeholder="Min 6 characters" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
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
