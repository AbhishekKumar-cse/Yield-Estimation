import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/check')({
  component: RouteComponent,
})

const progressStatus = [
  {key: 'complaint-registered', name: '📨 Complaint Registered'},
  {key: 'verification-in-progress', name: '🔍 Verification in Progress'},
  {key: 'officer-review', name: '👨‍🌾 Officer Review'},
  {key: 'resolution-complete', name: '✔ Resolution Complete'},
]

// Assuming the backend will return a simplified complaint object
interface ComplaintStatus {
  _id: string;
  issue: string;
  crop: string;
  details: string;
  status: 'complaint-registered' | 'verification-in-progress' | 'officer-review' | 'resolution-complete';
  // Other non-sensitive fields if any
}

function RouteComponent() {
  const { t } = useTranslation();
  const [complaintIdInput, setComplaintIdInput] = useState('');
  const [submittedComplaintId, setSubmittedComplaintId] = useState('');
  const params = Route.useSearch()
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedComplaintId(complaintIdInput);
  };

  useEffect(() => {
    if (params.complaintId) {
      setComplaintIdInput(params.complaintId)
    }
  }, [])

  const { data: complaint, isLoading, error } = useQuery<ComplaintStatus>({
    queryKey: ['complaintStatus', submittedComplaintId],
    queryFn: () => axios.get(`http://localhost:8000/complaint/check?complaint_id=${submittedComplaintId}`).then(res => res.data),
    enabled: !!submittedComplaintId, // Only run query if submittedComplaintId is not empty
  });

  const currentStatusIndex = complaint ? progressStatus.findIndex(s => s.key === complaint.status) : -1;

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-card/30 p-4 sm:p-6 lg:p-8'>
      <div className='max-w-3xl mx-auto'>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('Check Complaint Status')}</CardTitle>
            <CardDescription>{t('Enter your Complaint ID below to check its status.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                id="complaintId"
                type="text"
                value={complaintIdInput}
                onChange={(e) => setComplaintIdInput(e.target.value)}
                placeholder={t('Enter Complaint ID')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
              <Button type="submit">{t('Check Status')}</Button>
            </form>
          </CardContent>
        </Card>

        {submittedComplaintId && (
          isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader className='mr-2 h-8 w-8 animate-spin' /> {t('Loading complaint status...')}
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-8 text-red-500'>
              {t('Error loading complaint:')} {error.message || "error loading"}
            </div>
          ) : !complaint ? (
            <div className='flex items-center justify-center py-8'>
              {t('Complaint not found.')}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('Complaint Status:')} #{complaint._id}</CardTitle>
                <CardDescription>{t('Current status of your complaint.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Complaint Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('Complaint Details')}</h3>
                  <p><strong>{t('Issue:')}</strong> {complaint.issue}</p>
                  <p><strong>{t('Crop Insured:')}</strong> {complaint.crop}</p>
                  <p><strong>{t('Description:')}</strong> {complaint.details}</p>
                </div>

                {/* Progress Tracker */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('Progress Tracker')}</h3>
                  <div className="space-y-4">
                    {progressStatus.map((status, index) => (
                      <div key={status.key} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index <= currentStatusIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className={`font-medium ${
                            index <= currentStatusIndex ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {status.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
