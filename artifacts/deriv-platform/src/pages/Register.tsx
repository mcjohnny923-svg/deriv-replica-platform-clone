import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registerUser, saveAuth } from '@/lib/auth-api';
import { COUNTRIES } from '@/lib/countries';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') ?? undefined;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^254\d{9}$/.test(formData.phone)) {
      setError('Phone number must be in 2547XXXXXXXX format (e.g. 254712345678)');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const data = await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: fullName || undefined,
        referralCode,
        phoneNumber: formData.phone,
      });
      saveAuth(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-2xl font-bold text-white">TradePro</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-gray-400">
            You'll get both a Demo account (USD 10,000 virtual balance) and a Real account, ready to switch between anytime.
          </p>
          {referralCode && (
            <div className="mt-3 inline-block bg-green-500/10 border border-green-500 text-green-400 text-sm rounded-full px-4 py-1">
              Referred by code: {referralCode}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="country" className="text-gray-300">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-white hover:bg-gray-600">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="254712345678"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 254 followed by 9 digits, no + or spaces. Used for M-Pesa deposits.
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-red-500 hover:text-red-400">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-red-500 hover:text-red-400">Privacy Policy</a>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={!agreedToTerms || loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
