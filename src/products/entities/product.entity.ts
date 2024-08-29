import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ProductImage } from './product-image.entity';
import { User } from '../../auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'products' })
export class Product {

    @ApiProperty({
        example: '73a936ee-4c6b-4005-864c-d1a8fc3d2c43',
        description: 'Product Id',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 'T-shirt',
        description: 'Product title',
        uniqueItems: true
    })
    @Column('text', {
        unique: true,
    })
    title: string;

    @ApiProperty({
        example: 0,
        description: 'Product price',
    })
    @Column('float', {
        default: 0
    })
    price: number;

    @ApiProperty({
        example: 'Est mollit fugiat aute eiusmod pariatur fugiat voluptate sint voluptate sunt.',
        description: 'Product description',
        default: null
    })
    @Column({
        type:'text',
        nullable: true
    })
    description: string;

    @ApiProperty({
        example: 't_shirt_teslo',
        description: 'Product slug - for SEO',
        uniqueItems: true
    })
    @Column('text', {
        unique: true
    })
    slug: string;

    @ApiProperty({
        example: 10,
        description: 'Product stock',
        default: 0
    })
    @Column('int', {
        default: 0
    })
    stock: number;

    @ApiProperty({
        example: ['M', 'XL','XXL'],
        description: 'Product sizes'
    })
    @Column('text', {
        array: true
    })
    sizes: string[];

    @ApiProperty({
        example: 'men',
        description: 'Product gender'
    })
    @Column('text')
    gender:string;
    
    @ApiProperty()
    @Column('text', {
        array: true,
        default: []
    })
    tags: string[];

    @ApiProperty()
    @OneToMany(
        () => ProductImage,
        (productuctImage) => productuctImage.product,
        { cascade: true, eager: true }
    )
    images?: ProductImage[];

    @ManyToOne(
        () => User,
        (user) => user.product,
        { eager: true }
    )
    user: User;

    @BeforeInsert()
    checkSlugInsert(){
       if(!this.slug){
          this.slug = this.title
       }

       this.slug = this.slug
          .toLowerCase()
          .replaceAll(' ', '_')
          .replaceAll("'", '' )

    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug = this.slug
          .toLowerCase()
          .replaceAll(' ', '_')
          .replaceAll("'", '' )
  
    }
}
