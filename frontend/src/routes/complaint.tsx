import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Loader } from 'lucide-react'

export const Route = createFileRoute('/complaint')({
  component: RouteComponent,
})


const issuesFacedByFarmers = [
  { key: 'wrong-yield', name: '❌ Wrong yield estimation' },
  { key: 'crop-loss-not-detected', name: '🌾 Crop loss not detected'},
  { key: 'farm-boundary-wrong', name: '🛰️ Farm boundary wrong'},
  { key: 'pest-disease-not-captured', name: '🐛 Pest/disease not captured'},
  { key: 'insurance-claim-delay', name: '📄 Insurance claim delay'},
  { key: 'payment-not-received', name: '💰 Payment not received'},
  { key: 'upload-satellite-drone-issue', name: '📷 Upload satellite/drone issue'},
  { key: 'other-problem', name: '✍️ Other problem'},
]

function RouteComponent() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [issue, setIssue] = useState(issuesFacedByFarmers[0].key);
  const [aadhaar, setAadhaar] = useState('');
  const [pmfby, setPmfby] = useState('');
  const [crop, setCrop] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setIssue(issuesFacedByFarmers[0].key);
    setAadhaar('');
    setPmfby('');
    setCrop('');
    setDetails('');
    setSubmittedComplaintId(null);
    setSubmissionError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    const formData = {
      name,
      phone,
      issue,
      aadhaar,
      pmfby,
      crop,
      details,
    };

    try {
      const response = await axios.post('http://localhost:8000/complaint', formData);
      if (response.data && response.data.complaint_id) {
        setSubmittedComplaintId(response.data.complaint_id);
        // Clear form fields after successful submission
        setName('');
        setPhone('');
        setIssue(issuesFacedByFarmers[0].key);
        setAadhaar('');
        setPmfby('');
        setCrop('');
        setDetails('');
      } else {
        setSubmissionError(t('Error submitting complaint:') + ' No complaint ID received.');
      }
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      setSubmissionError(t('Error submitting complaint:') + ' ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedComplaintId) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-card/30 p-4 sm:p-6 lg:p-8'>
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>{t('Complaint submitted successfully!')}</CardTitle>
              <CardDescription>{t('Thank you for submitting your complaint. You can use the ID below for future reference.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-bold">{t('Your Complaint ID is:')} <span className="text-primary">{submittedComplaintId}</span></p>
              <p className="text-muted-foreground">{t('You can use this ID to check the status of your complaint.')}</p>
              <Button onClick={resetForm} className="w-full">{t('File another Complaint')}</Button>
              <Button variant="outline" onClick={() => window.location.href = `/check?complaintId=${submittedComplaintId}`} className="w-full">
                {t('Check Status')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-card/30 p-4 sm:p-6 lg:p-8'>
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle>{t('File a Complaint')}</CardTitle>
            <CardDescription>
              {t('Please fill out the form below to submit your complaint. We will get back to you as soon as possible.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">{t('Error:')}</strong>
                <span className="block sm:inline"> {submissionError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">{t('Name')}</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Enter your full name')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">{t('Phone Number')}</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('Enter your 10-digit phone number')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              {/* Issue */}
              <div className="space-y-2">
                <label htmlFor="issue" className="text-sm font-medium">{t('Issue')}</label>
                <select
                  id="issue"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {issuesFacedByFarmers.map(issueItem => (
                    <option key={issueItem.key} value={issueItem.key}>
                      {t(issueItem.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aadhaar Card */}
              <div className="space-y-2">
                <label htmlFor="aadhaar" className="text-sm font-medium">{t('Aadhaar Card Number')}</label>
                <input
                  id="aadhaar"
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  placeholder={t('Enter your 12-digit Aadhaar number')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  pattern="\d{12}"
                  required
                />
              </div>

              {/* PMFBY Enrollment ID */}
              <div className="space-y-2">
                <label htmlFor="pmfby" className="text-sm font-medium">{t('PMFBY Enrollment ID')}</label>
                <input
                  id="pmfby"
                  type="text"
                  value={pmfby}
                  onChange={(e) => setPmfby(e.target.value)}
                  placeholder={t('Enter your PMFBY Enrollment ID')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              
              {/* Crop Insured */}
              <div className="space-y-2">
                <label htmlFor="crop" className="text-sm font-medium">{t('Crop Insured')}</label>
                <input
                  id="crop"
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder={t('e.g., Wheat, Maize')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Complaint Details */}
              <div className="space-y-2">
                <label htmlFor="details" className="text-sm font-medium">{t('Complaint Details')}</label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('Please describe your issue in detail.')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? t('Submitting Complaint...') : t('Submit Complaint')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
