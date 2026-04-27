export interface KbsGuestData {
  reservationId: string
  tenantId: string
  guestFirstName: string
  guestLastName: string
  guestTcId: string | null
  guestPassportNo: string | null
  guestNationality: string | null
  guestDateOfBirth: Date | null
  roomNumber: string
  checkIn: Date
}

export interface KbsJobData extends KbsGuestData {
  attemptedAt?: string
}
