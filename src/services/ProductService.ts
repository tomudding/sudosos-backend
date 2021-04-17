/**
 *  SudoSOS back-end API service.
 *  Copyright (C) 2020  Study association GEWIS
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { createQueryBuilder } from 'typeorm';
import User from '../entity/user/user';
import { ProductResponse } from '../controller/response/product-response';
import Product from '../entity/product/product';
import ProductRevision from '../entity/product/product-revision';
import UpdatedProduct from '../entity/product/updated-product';
import DineroTransformer from '../entity/transformer/dinero-transformer';

/**
 * Wrapper for all Product related logic.
 */
export default class ProductService {

  /**
   * Transforms a raw product response from the query to a ProductResponse.
   * @param rawProduct - Query response to parse.
   */
  public static parseRawProduct(rawProduct: any): ProductResponse {
    return {
      id: rawProduct.product_id,
      alcoholPercentage: rawProduct.alcoholPercentage,
      category: {
        id: rawProduct.category_id,
        name: rawProduct.category_name,
      },
      createdAt: rawProduct.product_createdAt,
      name: rawProduct.productrevision_name,
      owner: {
        id: rawProduct.owner_id,
        firstName: rawProduct.owner_firstName,
        lastName: rawProduct.owner_lastName,
      },
      picture: rawProduct.productrevision_picture,
      price: DineroTransformer.Instance.from(rawProduct.productrevision_price),
      revision: rawProduct.productrevision_revision,
      updatedAt: rawProduct.productrevision_updatedAt,
    } as ProductResponse;
  }

  /**
   * Query for getting all products based on user.
   * @param owner
   * @param returnUpdated
   * @param productId
   */
  public static async getProducts(owner: User = null, returnUpdated: boolean = true, productId: number = null)
    : Promise<ProductResponse[]> {
    const builder = createQueryBuilder()
      .from(Product, 'product')
      .innerJoinAndSelect(ProductRevision, 'productrevision',
        'product.id = productrevision.product '
            + 'AND product.currentRevision = productrevision.revision')
      .innerJoinAndSelect('product.owner', 'owner')
      .innerJoinAndSelect('productrevision.category', 'category')
      .select([
        'product.id', 'product.createdAt', 'productrevision.updatedAt', 'productrevision.revision',
        'productrevision.name', 'productrevision.price', 'owner.id', 'owner.firstName', 'owner.lastName', 'category.id',
        'category.name', 'productrevision.picture', 'productrevision.alcoholpercentage',
      ]);

    if (owner !== null) {
      builder.where('product.owner = :owner', { owner: owner.id });
    }

    if (productId !== null) {
      builder.where('product.id = :productId', { productId: productId })
    }

    if (!returnUpdated) {
      builder.where((qb) => {
        const subQuery = qb.subQuery()
          .select('updatedproduct.product')
          .from(UpdatedProduct, 'updatedproduct')
          .getQuery();
        return `product.id NOT IN (${subQuery})`;
      });
    }
    // return builder.getRawMany();

    const rawProducts = await builder.getRawMany();

    console.debug(rawProducts);
    return rawProducts.map((rawProduct) => {
      return this.parseRawProduct(rawProduct);
    });
  }

  /**
   * Query to return all updated products.
   * @param owner
   */
  public static async getUpdatedProducts(owner: User = null): Promise<ProductResponse[]> {
    const builder = createQueryBuilder(Product)
      .innerJoin(UpdatedProduct, 'updatedproduct',
        'product.id = updatedproduct.product')
      .select([
        'product.id', 'product.createdAt', 'updatedproduct.updatedAt', 'updatedproduct.name',
        'updatedproduct.price', 'product.owner', 'updatedproduct.category',
        'updatedproduct.picture', 'updatedproduct.alcoholpercentage',
      ]);
    if (owner !== null) {
      builder.where('product.owner = :owner', { owner: owner.id });
    }

    const rawProducts = await builder.getRawMany();
    return rawProducts.map((rawProduct) => {
      return this.parseRawProduct(rawProduct);
    });
  }

  /**
   * Query to return all products that have been updated.
   * @param owner
   */
  public static async getProductsWithUpdates(owner: User = null): Promise<ProductResponse[]> {
    const products = await this.getProducts(owner);
    const updatedProducts = await this.getUpdatedProducts(owner);

    return products.concat(updatedProducts) as ProductResponse[];
  }
}
