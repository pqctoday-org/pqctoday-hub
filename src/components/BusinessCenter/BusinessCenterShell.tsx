// SPDX-License-Identifier: GPL-3.0-only
import { Outlet } from 'react-router'

/**
 * Shell for /business/* routes. Just renders <Outlet /> for child routes
 * (Command Center dashboard at /business, Business Tools at /business/tools).
 *
 * 2026-08-01 follow-up ("remove dashboard and tools; open command center in
 * dashboard mode; add tool into practices section"): the Dashboard/Tools tab
 * bar that used to live here is gone — /business now always opens straight
 * into the dashboard (no mode toggle needed), and /business/tools is reached
 * from the rail's own Practice group instead (see personaConfig.ts's
 * NAV_PATH_LABELS + MainLayout.tsx's Practice-group rendering), not an
 * in-page tab.
 */
export const BusinessCenterShell = () => {
  return <Outlet />
}
