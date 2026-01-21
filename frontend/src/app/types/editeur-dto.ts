import { JeuDto } from "./jeu-dto"
import { PersonneDto } from "./personne-dto"

export interface EditeurDto {
    id : number | undefined
    nom : string
    contacts? : PersonneDto[] 
}
