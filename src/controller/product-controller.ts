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
import log4js, { Logger } from 'log4js';
import { Response } from 'express';
import BaseController, { BaseControllerOptions } from './base-controller';
import Policy from './policy';
import { RequestWithToken } from '../middleware/token-middleware';
import ProductService from '../service/product-service';
import ProductRequest, { ProductUpdateRequest } from './request/product-request';
import UpdatedProduct from '../entity/product/updated-product';

export default class ProductController extends BaseController {
  private logger: Logger = log4js.getLogger('ProductController');

  /**
   * Creates a new product controller instance.
   * @param options - The options passed to the base controller.
   */
  public constructor(options: BaseControllerOptions) {
    super(options);
    this.logger.level = process.env.LOG_LEVEL;
  }

  /**
   * @inheritdoc
   */
  getPolicy(): Policy {
    return {
      '/': {
        GET: {
          policy: async (req) => this.roleManager.can(req.token.roles, 'get', 'all', 'Product', ['*']),
          handler: this.returnAllProducts.bind(this),
        },
        POST: {
          body: { modelName: 'ProductRequest' },
          policy: async (req) => this.roleManager.can(req.token.roles, 'create', 'all', 'Product', ['*']),
          handler: this.createProduct.bind(this),
        },
      },
      '/:id(\\d+)': {
        GET: {
          policy: async (req) => this.roleManager.can(req.token.roles, 'get', 'all', 'Product', ['*']),
          handler: this.returnSingleProduct.bind(this),
        },
        PATCH: {
          body: { modelName: 'ProductUpdateRequest' },
          policy: async (req) => this.roleManager.can(req.token.roles, 'update', 'all', 'Product', ['*']),
          handler: this.updateProduct.bind(this),
        },
      },
      '/updated': {
        GET: {
          policy: async (req) => this.roleManager.can(req.token.roles, 'get', 'all', 'Product', ['*']),
          handler: this.returnAllUpdatedProducts.bind(this),
        },
      },
      '/:id(\\d+)/updated': {
        GET: {
          policy: async (req) => this.roleManager.can(req.token.roles, 'get', 'all', 'Product', ['*']),
          handler: this.returnSingleUpdatedProduct.bind(this),
        },
      },
      '/:id(\\d+)/approve': {
        POST: {
          policy: async (req) => this.roleManager.can(req.token.roles, 'create', 'all', 'Product', ['*']),
          handler: this.approveUpdate.bind(this),
        },
      },
    };
  }

  /**
   * Returns all existing products
   * @route GET /products
   * @group products - Operations of product controller
   * @security JWT
   * @returns {Array<ProductResponse>} 200 - All existing products
   * @returns {string} 500 - Internal server error
   */
  public async returnAllProducts(req: RequestWithToken, res: Response): Promise<void> {
    const { body } = req;
    this.logger.trace('Get all products', body, 'by user', req.token.user);

    // Handle request
    try {
      const products = await ProductService.getProducts();
      res.json(products);
    } catch (error) {
      this.logger.error('Could not return all products:', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Create a new product.
   * @route POST /products
   * @group products - Operations of product controller
   * @param {ProductRequest.model} product.body.required - The product which should be created
   * @security JWT
   * @returns {ProductResponse.model} 200 - The created product entity
   * @returns {string} 400 - Validation error
   * @returns {string} 500 - Internal server error
   */
  public async createProduct(req: RequestWithToken, res: Response): Promise<void> {
    const body = req.body as ProductRequest;
    this.logger.trace('Create product', body, 'by user', req.token.user);

    // handle request
    try {
      if (await ProductService.verifyProduct(body)) {
        res.json(await ProductService.createProduct(req.token.user, body));
      } else {
        res.status(400).json('Invalid product.');
      }
    } catch (error) {
      this.logger.error('Could not create product:', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Update an existing product.
   * @route PATCH /products/{id}
   * @group products - Operations of product controller
   * @param {integer} id.path.required - The id of the product which should be returned
   * @param {ProductUpdateRequest.model} product.body.required - The product which should be created
   * @security JWT
   * @returns {ProductResponse.model} 200 - The created product entity
   * @returns {string} 400 - Validation error
   * @returns {string} 500 - Internal server error
   */
  public async updateProduct(req: RequestWithToken, res: Response): Promise<void> {
    const body = req.body as ProductUpdateRequest;
    const { id } = req.params;
    this.logger.trace('Update product', id, 'with', body, 'by user', req.token.user);

    // handle request
    try {
      if (await ProductService.verifyUpdate(body)) {
        res.json(await ProductService.updateProduct(Number.parseInt(id, 10), body));
      } else {
        res.status(400).json('Invalid product.');
      }
    } catch (error) {
      this.logger.error('Could not update product:', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Approve a product update.
   * @route POST /products/{id}/approve
   * @param {integer} id.path.required - The id of the product to update
   * @group products - Operations of product controller
   * @security JWT
   * @returns {ProductResponse.model} 200 - The approved product entity
   * @returns {string} 400 - Validation error
   * @returns {string} 404 - Not found error
   * @returns {string} 500 - Internal server error
   */
  public async approveUpdate(req: RequestWithToken, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.trace('Update accepted', id, 'by user', req.token.user);

    const productId = Number.parseInt(id, 10);
    // Handle
    try {
      const product = await ProductService.confirmProductUpdate(productId);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json('Product update not found.');
      }
    } catch (error) {
      this.logger.error('Could not approve update: ', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Returns the requested product
   * @route GET /products/{id}
   * @group products - Operations of products controller
   * @param {integer} id.path.required - The id of the product which should be returned
   * @security JWT
   * @returns {ProductResponse.model} 200 - The requested product entity
   * @returns {string} 404 - Not found error
   * @returns {string} 500 - Internal server error
   */
  public async returnSingleProduct(req: RequestWithToken, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.trace('Get single product', id, 'by user', req.token.user);

    // handle request
    try {
      // check if product in database
      const product = await ProductService.getProducts({ productId: parseInt(id, 10) });
      if (product) {
        res.json(product);
      } else {
        res.status(404).json('Product not found.');
      }
    } catch (error) {
      this.logger.error('Could not return product:', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Returns all updated products
   * @route GET /products/updated
   * @group products - Operations of product controller
   * @security JWT
   * @returns {Array<ProductResponse>} 200 - All existing updated products
   * @returns {string} 500 - Internal server error
   */
  public async returnAllUpdatedProducts(req: RequestWithToken, res: Response): Promise<void> {
    const { body } = req;
    this.logger.trace('Get all updated products', body, 'by user', req.token.user);

    // Handle request
    try {
      const products = await ProductService.getUpdatedProducts();
      res.json(products);
    } catch (error) {
      this.logger.error('Could not return all products:', error);
      res.status(500).json('Internal server error.');
    }
  }

  /**
   * Returns the requested updated product
   * @route GET /products/{id}/updated
   * @group products - Operations of products controller
   * @param {integer} id.path.required - The id of the product which should be returned
   * @security JWT
   * @returns {ProductResponse.model} 200 - The requested updated product entity
   * @returns {string} 404 - Not found error
   * @returns {string} 500 - Internal server error
   */
  public async returnSingleUpdatedProduct(req: RequestWithToken, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.trace('Get single product', id, 'by user', req.token.user);

    // handle request
    try {
      // check if product in database
      const product = await ProductService.getUpdatedProducts({ productId: parseInt(id, 10) });
      if (product) {
        res.json(product);
      } else {
        res.status(404).json('Product not found.');
      }
    } catch (error) {
      this.logger.error('Could not return product:', error);
      res.status(500).json('Internal server error.');
    }
  }
}
