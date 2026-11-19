import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsApi } from '../../lib/api';
import { UserPlus, ArrowLeft, CheckCircle2, User, Phone, Mail, Shield, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const StudentAdmission: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Hostel@123');

  const [regNumber, setRegNumber] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [department, setDepartment] = useState('School of Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [permanentAddress, setPermanentAddress] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Father');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await studentsApi.admitStudent({
        full_name: fullName,
        email,
        username,
        phone,
        password,
        registration_number: regNumber,
        course,
        department,
        year_of_study: Number(yearOfStudy),
        gender,
        blood_group: bloodGroup,
        permanent_address: permanentAddress,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        guardian_phone: guardianPhone,
        guardian_email: guardianEmail || undefined
      });
      navigate('/students');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to admit student. Please check for duplicate email or registration number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/students')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-700" />
            Resident Admission Registration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create resident profile and credentials for student portal self-service
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Login Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" />
              1. Personal Details & User Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address (Institution or Personal)"
                type="email"
                placeholder="e.g. aarav@hostel.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!username && e.target.value.includes('@')) {
                    setUsername(e.target.value.split('@')[0].toLowerCase());
                  }
                }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Portal Username"
                placeholder="e.g. aarav"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                label="Initial Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Default: Hostel@123"
              />

              <Input
                label="Mobile Phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Academic Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-700" />
              2. Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registration / Roll Number"
                placeholder="e.g. REG-2026-109"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                required
              />

              <Input
                label="Degree / Course"
                placeholder="e.g. B.Tech Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Department / School"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />

              <Select
                label="Year of Study"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
              >
                <option value="1">1st Year (Freshman)</option>
                <option value="2">2nd Year (Sophomore)</option>
                <option value="3">3rd Year (Junior)</option>
                <option value="4">4th Year (Senior)</option>
              </Select>

              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>

              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </div>

            <Input
              label="Permanent Residential Address"
              placeholder="e.g. 14/B Model Town, New Delhi, India"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Section 3: Guardian & Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-700" />
              3. Parent / Guardian Details (Emergency Contact)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Guardian Full Name"
                placeholder="e.g. Sunil Sharma"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                required
              />

              <Input
                label="Relationship to Student"
                placeholder="e.g. Father / Mother / Uncle"
                value={guardianRelation}
                onChange={(e) => setGuardianRelation(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Guardian Emergency Phone"
                placeholder="+91 98111 22233"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                required
              />

              <Input
                label="Guardian Email (Optional)"
                type="email"
                placeholder="parent@gmail.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/students')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Complete Admission & Register
          </Button>
        </div>
      </form>
    </div>
  );
};
