import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductDto } from './dto/product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid'
import { ProductImage,Product } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ){}

  async create(createProductDto: CreateProductDto) {
      try {

        const { images = [], ...productDetails } = createProductDto;

       const product = this.productRepository.create(
       {
          ...productDetails,
          images: images.map(image => this.productImageRepository.create({ url: image }))
      });
       await this.productRepository.save(product);

       return { ...product, images: images };

      } catch (error) {

        this.handleDBExceptions(error);
      }
  }

  async findAll(paginationDto : PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

     var products =  await this.productRepository.find({
       take : limit,
       skip : offset,
       relations: {
        images: true
       }
     });
     return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
     }))
  }

  async findOne(term: string) {

    return await  this.findOnedb(term);
  }

  async findOnePlane(term: string){
    const { images = [], ...rest } = await this.findOnedb(term);

    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

   async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate  } = updateProductDto

    const product = await this.productRepository.preload({
      id: id,
      ...toUpdate
    });

    if(!product) throw new NotFoundException(`Product with id ${id} not found`);

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if(images){
        await queryRunner.manager.delete(ProductImage, { product: { id: id } });

        product.images = images.map(image => this.productImageRepository.create({url: image}))
      } 

      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlane(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);
    }

    return this.findOne;
  }

  async remove(id: string) {
    await  this.findOnedb(id);
    await this.productRepository.delete(id);
  }

  private async findOnedb(term: string){
    let product: Product;

    if(isUUID(term)){
      product = await this.productRepository.findOneBy({id: term})
    }else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod')
      product = await queryBuilder.where('upper(title) =:title or slug=:slug', {
        title: term.toUpperCase(),
        slug:term.toLocaleLowerCase()
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    }
    
    //var product: ProductDto = await  this.productRepository.findOneBy({id});
    
    if(!product){
      throw new NotFoundException(`Product with id ${ term } not found`);
    }

    return product
  }

  private handleDBExceptions(error: any) {
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
             .delete()
             .where({})
             .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

}
