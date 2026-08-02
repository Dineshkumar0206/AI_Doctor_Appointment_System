import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Search, User, AlertCircle, Phone, Mail, Calendar, Eye, ShieldAlert, Heart } from 'lucide-react'
import { useState } from 'react'

interface Patient {
  patientId: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  age: number
  gender: string
  bloodGroup: string
  address: string
  emergencyContact: string
  medicalNotes: string
  hospitalDetails?: string
  appointmentCount: number
  upcomingAppointment: string
}

export default function DoctorPatientsPage() {
  const [searchVal, setSearchVal] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

  // Fetch Doctor's Patients
  const { data: patientsRes, isLoading: patientsLoading } = useQuery({
    queryKey: ['doctor-patients', searchVal],
    queryFn: () => {
      const searchParam = searchVal ? `?keyword=${searchVal}` : ''
      return api.get(`/doctor/patients${searchParam}`).then(res => res.data.data.content as Patient[])
    }
  })
  const patients = patientsRes ?? []

  // Fetch Selected Patient Details
  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['doctor-patient-detail', selectedPatientId],
    queryFn: () => api.get(`/doctor/patients/${selectedPatientId}`).then(res => res.data.data as Patient),
    enabled: selectedPatientId !== null
  })
  const selectedPatient = detailRes

  return (
    <div className="space-y-6">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Patient Database</h1>
          <p className="text-sm text-dark-300">View and manage clinical records of your registered patients.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search patients by name..."
            className="w-full pl-10 pr-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-sm outline-none text-dark-100 placeholder-dark-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Patient Cards List */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {patientsLoading ? (
            <div className="col-span-full py-12 text-center text-dark-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="col-span-full py-12 text-center text-dark-500 border border-dark-800 border-dashed rounded-2xl">
              <AlertCircle className="w-8 h-8 mx-auto text-dark-700 mb-2" />
              No patient records found
            </div>
          ) : (
            patients.map(p => (
              <div
                key={p.patientId}
                className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4 dark:bg-dark-950 dark:border-blue-500/30 dark:hover:border-blue-400"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-300 flex items-center justify-center text-blue-600 font-bold dark:text-blue-400 dark:border-blue-500/30">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base dark:text-dark-100">{p.fullName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 dark:text-dark-400">{p.gender} · {p.age} Yrs</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-2 text-slate-600 dark:text-dark-300">
                      <Phone className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>{p.phone || 'No phone'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-600 dark:text-dark-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>Next slot: <strong className="text-blue-600 dark:text-blue-400">{p.upcomingAppointment}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-blue-200 dark:border-dark-800 text-xs">
                  <span className="text-slate-600 dark:text-dark-400">Total visits: <strong className="text-slate-800 dark:text-dark-100">{p.appointmentCount}</strong></span>
                  <button
                    onClick={() => setSelectedPatientId(p.patientId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-100 hover:border-blue-500 text-blue-600 font-semibold transition-colors dark:border-dark-600 dark:bg-dark-900 dark:hover:bg-dark-800 dark:text-blue-400"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Record</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Patient Details Panel (Sidebar style) */}
        <div className="lg:col-span-4 bg-white dark:bg-dark-950 border-2 border-blue-200 dark:border-blue-500/20 rounded-2xl p-6 min-h-[400px]">
          {selectedPatientId === null ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <User className="w-12 h-12 text-blue-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-dark-200 mb-1">Select Patient</h3>
              <p className="text-xs text-slate-500 dark:text-dark-300 max-w-[200px]">Click "View Record" on any patient card to display their full clinical summary.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-dark-500 py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              Loading records...
            </div>
          ) : selectedPatient ? (
            <div className="space-y-6 animate-fade-in">
              {/* Patient Basic Card */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold mx-auto border border-blue-500/20">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-dark-50 text-lg">{selectedPatient.fullName}</h4>
                  <p className="text-xs text-dark-400">{selectedPatient.gender} · {selectedPatient.age} Yrs · DOB: {selectedPatient.dateOfBirth}</p>
                </div>
              </div>

              {/* Contact info list */}
              <div className="space-y-3 pt-4 border-t border-dark-900 text-xs">
                <p className="flex items-center gap-3 text-dark-200">
                  <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{selectedPatient.phone || 'Not provided'}</span>
                </p>
                <p className="flex items-center gap-3 text-dark-200">
                  <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{selectedPatient.email}</span>
                </p>
              </div>

              {/* Health parameters */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-900 text-xs">
                <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl">
                  <p className="text-blue-400 uppercase font-bold">Blood Group</p>
                  <p className="font-bold text-red-400 mt-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-red-400/25" />
                    <span>{selectedPatient.bloodGroup || 'Unknown'}</span>
                  </p>
                </div>
                <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl">
                  <p className="text-amber-400 uppercase font-bold">Emergency Call</p>
                  <p className="font-semibold text-dark-100 mt-1">{selectedPatient.emergencyContact || 'None'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 text-xs">
                <p className="text-blue-400 uppercase font-bold">Home Address</p>
                <p className="text-dark-200 bg-dark-900 border border-dark-800 rounded-xl p-3 leading-relaxed">
                  {selectedPatient.address || 'No address registered.'}
                </p>
              </div>

              {/* Hospital details */}
              <div className="space-y-1.5 text-xs">
                <p className="text-emerald-400 uppercase font-bold">Hospital Details</p>
                <p className="text-dark-200 bg-dark-900 border border-dark-800 rounded-xl p-3 leading-relaxed">
                  {selectedPatient.hospitalDetails || 'No hospital details registered.'}
                </p>
              </div>

              {/* General medical notes */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="uppercase font-bold text-amber-400">Medical History Notes</span>
                </div>
                <p className="text-dark-200 bg-dark-900 border border-dark-800 rounded-xl p-3 leading-relaxed min-h-[80px]">
                  {selectedPatient.medicalNotes || 'No past conditions or allergies listed.'}
                </p>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}
