import { router } from './server'
import { reservationRouter } from '@/modules/reservation/router'
import { roomRouter } from '@/modules/room/router'
import { guestRouter } from '@/modules/guest/router'
import { hkRouter } from '@/modules/housekeeping/router'
import { maintenanceRouter } from '@/modules/maintenance/router'
import { lostFoundRouter } from '@/modules/lost-found/router'

export const appRouter = router({
  reservation: reservationRouter,
  room: roomRouter,
  guest: guestRouter,
  hk: hkRouter,
  maintenance: maintenanceRouter,
  lostFound: lostFoundRouter,
})

export type AppRouter = typeof appRouter
