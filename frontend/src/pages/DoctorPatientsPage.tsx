import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Search, User, AlertCircle, Phone, Mail, Calendar, Eye, ShieldAlert, Heart } from 'lucide-react'
import { useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }
})

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
      return axios.get(`${BASE_URL}/doctor/patients${searchParam}`, getHeaders()).then(res => res.data.data.content as Patient[])
    }
  })
  const patients = patientsRes ?? []

  // Fetch Selected Patient Details
  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['doctor-patient-detail', selectedPatientId],
    queryFn: () => axios.get(`${BASE_URL}/doctor/patients/${selectedPatientId}`, getHeaders()).then(res => res.data.data as Patient),
    enabled: selectedPatientId !== null
  })
  const selectedPatient = detailRes

  return (
    <div className="space-y-6">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Patient Database</h1>
          <p className="text-sm text-dark-400">View and manage clinical records of your registered patients.</p>
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
                className="bg-dark-950 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{p.fullName}</h3>
                      <p className="text-xs text-dark-400 mt-0.5">{p.gender} · {p.age} Yrs</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-dark-300">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-dark-500" />
                      <span>{p.phone || 'No phone'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-dark-500" />
                      <span>Next slot: <strong className="text-blue-400">{p.upcomingAppointment}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dark-900 text-xs">
                  <span className="text-dark-400">Total visits: <strong className="text-white">{p.appointmentCount}</strong></span>
                  <button
                    onClick={() => setSelectedPatientId(p.patientId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 hover:bg-dark-900 text-blue-400 font-semibold transition-colors"
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
        <div className="lg:col-span-4 bg-dark-950 border border-dark-800 rounded-2xl p-6 min-h-[400px]">
          {selectedPatientId === null ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-dark-500 py-16">
              <User className="w-12 h-12 text-dark-800 mb-4" />
              <h3 className="text-base font-semibold text-dark-300 mb-1">Select Patient</h3>
              <p className="text-xs max-w-[200px]">Click "View Record" on any patient card to display their full clinical summary.</p>
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
                  <h4 className="font-bold text-white text-lg">{selectedPatient.fullName}</h4>
                  <p className="text-xs text-dark-400">{selectedPatient.gender} · {selectedPatient.age} Yrs · DOB: {selectedPatient.dateOfBirth}</p>
                </div>
              </div>

              {/* Contact info list */}
              <div className="space-y-3 pt-4 border-t border-dark-900 text-xs">
                <p className="flex items-center gap-3 text-dark-300">
                  <Phone className="w-4 h-4 text-dark-500 flex-shrink-0" />
                  <span>{selectedPatient.phone || 'Not provided'}</span>
                </p>
                <p className="flex items-center gap-3 text-dark-300">
                  <Mail className="w-4 h-4 text-dark-500 flex-shrink-0" />
                  <span>{selectedPatient.email}</span>
                </p>
              </div>

              {/* Health parameters */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-900 text-xs">
                <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl">
                  <p className="text-dark-500 uppercase font-semibold">Blood Group</p>
                  <p className="font-bold text-red-400 mt-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-red-400/25" />
                    <span>{selectedPatient.bloodGroup || 'Unknown'}</span>
                  </p>
                </div>
                <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl">
                  <p className="text-dark-500 uppercase font-semibold">Emergency Call</p>
                  <p className="font-semibold text-white mt-1">{selectedPatient.emergencyContact || 'None'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 text-xs">
                <p className="text-dark-500 uppercase font-semibold">Home Address</p>
                <p className="text-dark-200 bg-dark-900 border border-dark-800 rounded-xl p-3 leading-relaxed">
                  {selectedPatient.address || 'No address registered.'}
                </p>
              </div>

              {/* General medical notes */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-dark-500">
                  <ShieldAlert className="w-4 h-4 text-dark-500" />
                  <span className="uppercase font-semibold">Medical History Notes</span>
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
