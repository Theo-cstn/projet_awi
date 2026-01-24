import { EditeurDto } from "./editeur-dto"
import { PersonneDto } from "./personne-dto"

export interface JeuDto {
    id: number | undefined
    nom: string 
    typeG: string  
    age_min: number | null; 
    age_max: number | null;
    
    // Relations
    editeur_id: number  
    editeur?: EditeurDto  
    auteurs?: PersonneDto[]
}
