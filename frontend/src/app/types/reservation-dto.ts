export interface Reservation {
    id: number|undefined
    festival_id: number
    editeur_id?: number // seulement si type = editeur
    type: 'editeur' | 'prestataire' | 'boutique' | 'autre'
    nom_reservant?: string

    nombre_tables: number
    nombre_prises: number
    est_present: boolean
    remise_generale: number

    status: string
    date_creation: Date
    date_facturation?: Date
    date_paiement?: Date
    
}