import { router } from './server'
import { reservationRouter } from '@/modules/reservation/router'
import { roomRouter } from '@/modules/room/router'
import { guestRouter } from '@/modules/guest/router'

export const appRouter = router({
  reservation: reservationRouter,
  room: roomRouter,
  guest: guestRouter,
})

export type AppRouter = typeof appRouter
