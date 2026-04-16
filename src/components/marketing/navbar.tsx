import { getCurrentUser } from "@/lib/auth"
import { NavbarClient } from "@/components/marketing/navbar-client"

export async function Navbar() {
  const currentUser = await getCurrentUser()
  return <NavbarClient currentUser={currentUser} />
}
