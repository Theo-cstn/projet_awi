import { EditeurDto } from "./editeur-dto"
import { PersonneDto } from "./personne-dto"

export interface JeuDto {
    id : number | undefined
    nom : string
    
    ageMin : number | undefined
    ageMax : number | undefined

    editeur : EditeurDto
    auteur : PersonneDto | undefined

    type : string
    taille : 'petit' | 'grand' | undefined
}
