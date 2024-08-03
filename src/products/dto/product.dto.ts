import { IsUUID } from "class-validator";

export class ProductDto {
    id: string;
    title: string;
    price?: number;
    description?: string;
    slug?: string;
    stock?: number;
    sizes: string[];
    gender:string;
    images: string[]
}
