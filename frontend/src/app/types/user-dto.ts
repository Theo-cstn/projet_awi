export type Role = 'no-role' | 'visiteur' | 'organisateur_jeux' | 'organisateur_reservations' | 'admin'

export interface UserDto {
  id: number
  login: string
  role: Role
}