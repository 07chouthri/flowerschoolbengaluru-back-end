import {
  users,
  products,
  courses,
  orders,
  enrollments,
  testimonials,
  blogPosts,
  carts,
  favorites,
  coupons,
  addresses,
  deliveryOptions,
  orderStatusHistory,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Course,
  type InsertCourse,
  type Order,
  type InsertOrder,
  type Enrollment,
  type InsertEnrollment,
  type Testimonial,
  type InsertTestimonial,
  type BlogPost,
  type InsertBlogPost,
  type Cart,
  type InsertCart,
  type Favorite,
  type InsertFavorite,
  type Coupon,
  type InsertCoupon,
  type Address,
  type InsertAddress,
  type DeliveryOption,
  type InsertDeliveryOption,
  type OrderPlacement,
  type OrderStatusHistory,
  type InsertOrderStatusHistory
} from "./shared/schema.js";
import { db } from "./db.js";
import { eq, and, sql, inArray, lte } from "drizzle-orm";
import { IStorage } from "./storage.js";

export class DatabaseStorage implements IStorage {

  async getUser(id: string): Promise<User | undefined> {
    try {
      if (!id) {
        throw new Error("User ID is required");
      }
      const query = `
      SELECT *
      FROM bouquetbar.users
      WHERE id = '${id}'
      LIMIT 1;
    `;
      console.log("Executing query:", query);
      const result = await db.query(query);
      console.log("Query Result:", result.rows || "No user found");
      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      throw new Error(
        `Failed to get user: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }


  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByEmail(email: string, password: string): Promise<User | undefined> {
    if (!email) return undefined;
    const query = `SELECT *
            FROM bouquetbar.users
            WHERE email = '${email}'
              AND  password='${password}'
            LIMIT 1`;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows || 'No user found');
    return result.rows[0] || undefined;
  }

  async getUserByEmailOnly(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const query = `SELECT *
            FROM bouquetbar.users
            WHERE email = '${email}'
            LIMIT 1`;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows || 'No user found');
    return result.rows[0] || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    if (!phone) return undefined;
    const query = `SELECT *
            FROM bouquetbar.users
            WHERE phone = '${phone}'
            LIMIT 1`;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows || 'No user found');
    return result.rows[0] || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Input validation
      if (!insertUser.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!insertUser.firstName?.trim()) {
        throw new Error('First name is required');
      }
      if (!insertUser.lastName?.trim()) {
        throw new Error('Last name is required');
      }
      if (!insertUser.phone?.trim()) {
        throw new Error('Phone number is required');
      }
      if (!insertUser.password?.trim()) {
        throw new Error('Password is required');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(insertUser.email)) {
        throw new Error('Invalid email format');
      }

      const query = {
        text: `
          INSERT INTO bouquetbar.users (
            email,
            firstname,
            lastname,
            phone,
            usertype,
            password,
            createdat,
            updatedat
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `,
        values: [
          insertUser.email.trim(),
          insertUser.firstName.trim(),
          insertUser.lastName.trim(),
          insertUser.phone.trim(),
          insertUser.password,
          'user',
          new Date(),
          new Date()
        ]
      };

      console.log('Executing query:', query);
      const result = await db.query(query);
      console.log('Insert Result:', result.rows);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateFields: string[] = [];
      if (updates.email) updateFields.push(`email = '${updates.email}'`);
      if (updates.firstName) updateFields.push(`firstname = '${updates.firstName}'`);
      if (updates.lastName) updateFields.push(`lastname = '${updates.lastName}'`);
      if (updates.phone) updateFields.push(`phone = '${updates.phone}'`);
      if (updates.password) updateFields.push(`password = '${updates.password}'`);
      if (updates.userType) updateFields.push(`usertype = '${updates.userType}'`);

      // Always update "updated_at"
      updateFields.push(`updatedat = NOW()`);

      if (updateFields.length === 1) { // Only updatedAt field
        throw new Error("No fields provided for update.");
      }

      const updateQuery = `
        UPDATE bouquetbar.users
        SET ${updateFields.join(", ")}
        WHERE id = '${id}'
        RETURNING *;
      `;
      console.log("Executing update query:", updateQuery);
      const result = await db.query(updateQuery);
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`User with id ${id} not found.`);
      }

      return result.rows[0];
    } catch (error) {
      console.error("[USER UPDATE ERROR] Failed to update user:", error);
      throw error;
    }
  }

  async updateUserProfile(id: string, profile: Partial<User>): Promise<User> {
    try {
      const updates: string[] = [];
      if (profile.email) updates.push(`email = '${profile.email}'`);
      if (profile.firstName) updates.push(`firstname = '${profile.firstName}'`);
      if (profile.lastName) updates.push(`lastname = '${profile.lastName}'`);
      if (profile.phone) updates.push(`phone = '${profile.phone}'`);
      if (profile.password) updates.push(`password = '${profile.password}'`);
      if (profile.userType) updates.push(`usertype = '${profile.userType}'`);
      if (profile.profileImageUrl) updates.push(`profileimageurl = '${profile.profileImageUrl}'`);
      if (profile.defaultAddress) updates.push(`defaultaddress = '${profile.defaultAddress}'`);
      if (profile.deliveryAddress) updates.push(`deliveryaddress = '${profile.deliveryAddress}'`);
      if (profile.country) updates.push(`country = '${profile.country}'`);
      if (profile.state) updates.push(`state = '${profile.state}'`);
      if (profile.points !== undefined) updates.push(`points = ${profile.points}`);

      // Always update "updated_at"
      updates.push(`updatedat = NOW()`);

      if (updates.length === 1) { // Only updatedAt field
        throw new Error("No fields provided for update.");
      }
      const updateQuery = `
      UPDATE bouquetbar.users
      SET ${updates.join(", ")}
      WHERE id = '${id}'
      RETURNING *;
    `;
      console.log("Executing update query:", updateQuery);
      const result = await db.query(updateQuery);
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`User with id ${id} not found.`);
      }

      return result.rows[0];
    } catch (error) {
      console.error("[USER UPDATE ERROR] Failed to update profile:", error);
      throw error;
    }
  }


  async deleteUser(id: string): Promise<void> {
    const query = `
    DELETE FROM bouquetbar.users
    WHERE id = '${id}';
  `;
    console.log('Executing query:', query);
    await db.query(query);
    console.log('User deleted successfully');
  }




  // Product Methods
  async getAllProducts(): Promise<Product[]> {
    try {
      const query = `
      SELECT *
      FROM bouquetbar.products
      ORDER BY createdat DESC;
      `;
      console.log('Executing query:', query);
      const result = await db.query(query);
      console.log('Query Result:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      throw new Error(`Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async getFeaturedProducts(): Promise<Product[]> {
    const query = `
    SELECT *
    FROM bouquetbar.products
    WHERE featured = true;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);

    return result.rows;
  }

  async getProductsByCategoryAndSubcategory(category: string, subcategory?: string): Promise<Product[]> {
    let query = `
      SELECT *
      FROM bouquetbar.products
      --WHERE category = '${category}'
    `;
    // if (subcategory) {
    //   query += ` AND subcategory = '${subcategory}'`;
    // }

    // query += ' ORDER BY createdat DESC;';

    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const query = `
    SELECT *
    FROM bouquetbar.products
    WHERE category = '${category}';
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }


  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const query = `
      SELECT *
      FROM bouquetbar.products
      WHERE id = $1
      LIMIT 1;
      `;
      console.log('Executing query:', query);
      const result = await db.query(query, [id]);
      console.log('Query Result:', result.rows);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error in getProduct:', error);
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueCount = 1;

      // Handle stockquantity field
      const stockQty = updates.stockQuantity ?? (updates as any).stockquantity;
      if (stockQty !== undefined) {
        updateFields.push(`stockquantity = $${valueCount}`);
        // Convert to number if it's a string
        values.push(typeof stockQty === 'string' ? parseInt(stockQty) : stockQty);
        valueCount++;
      }

      // Handle inStock field
      const inStockValue = updates.inStock ?? (updates as any).instock;
      if (inStockValue !== undefined) {
        updateFields.push(`"inStock" = $${valueCount}`);
        values.push(inStockValue);
        valueCount++;
      }
      
      // Always update the updated_at field
      updateFields.push(`updatedate = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE bouquetbar.products
        SET ${updateFields.join(', ')}
        WHERE id = $${valueCount}
        RETURNING *;
      `;

      console.log('Executing update query:', query);
      const result = await db.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error(`Product with id ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createProduct(productData: any): Promise<any> {
    try {
      // Validate stock quantity
      const stockQuantity = parseInt(productData.stockquantity?.toString() || '0');
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        throw new Error('Invalid stock quantity. Must be a non-negative number.');
      }

      // Log the incoming data (without the actual base64 data)
      console.log("Creating product with data:", {
        ...productData,
        stockquantity: stockQuantity,
        image: productData.image ? "[base64_data]" : null,
        imagefirst: productData.imagefirst ? "[base64_data]" : null,
        imagesecond: productData.imagesecond ? "[base64_data]" : null,
        imagethirder: productData.imagethirder ? "[base64_data]" : null
      });

      const query = {
        text: `
          INSERT INTO bouquetbar.products (
            name, description, price, category, stockquantity, 
            "inStock", featured, image, imagefirst, imagesecond, 
            imagethirder, imagefoure, imagefive
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `,
        values: [
          productData.name,
          productData.description,
          productData.price,
          productData.category,
          productData.stockQuantity,
           true, // instock based on stock quantity
          productData.featured || false,
          productData.image || null,
          productData.imagefirst || null,
          productData.imagesecond || null,
          productData.imagethirder || null,
          null, // imagefoure
          null  // imagefive
        ]
      };

      const result = await db.query(query.text, query.values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!id) {
      throw new Error('Product ID is required');
    }

    try {
      // First check if the product exists
      const product = await this.getProduct(id);
      if (!product) {
        throw new Error('Product not found');
      }

      const query = {
        text: `
          DELETE FROM bouquetbar.products
          WHERE id = $1
          RETURNING id;
        `,
        values: [id]
      };

      console.log('Executing delete query:', query.text);
      const result = await db.query(query.text, query.values);
      
      if (result.rowCount === 0) {
        throw new Error('Product could not be deleted');
      }

      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }




  // Inventory Management
  async updateProductStock(productId: string, quantityChange: number): Promise<Product> {
    const query = `
    UPDATE bouquetbar.products
    SET 
      stockquantity = stockquantity + ${quantityChange},
      inStock = (stockquantity + ${quantityChange} > 0),
      updated_at = NOW()
    WHERE id = '${productId}'
    RETURNING *;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Update Result:', result.rows);

    return result.rows[0];
  }

  async checkProductAvailability(productId: string, requiredQuantity: number): Promise<{ available: boolean; currentStock: number }> {
    const query = `
    SELECT stock_quantity
    FROM bouquetbar.products
    WHERE id = '${productId}'
    LIMIT 1;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);

    if (!result.rows[0]) {
      return { available: false, currentStock: 0 };
    }

    const currentStock = result.rows[0].stock_quantity;
    return {
      available: currentStock >= requiredQuantity,
      currentStock
    };
  }

  // Course Methods
  async getAllCourses(): Promise<Course[]> {
    const query = `
    SELECT *
    FROM bouquetbar.courses;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.courses
    WHERE id = '${id}'
    LIMIT 1;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const query = `
    INSERT INTO bouquetbar.courses (
      title,
      description,
      price,
      duration,
      sessions,
      features,
      popular,
      nextbatch,
      createdat
    ) VALUES (
      '${course.title}',
      '${course.description}',
      ${course.price},
      '${course.duration}',
      ${course.sessions},
      '${JSON.stringify(course.features)}',
      ${course.popular ?? false},
      '${course.nextBatch ?? ''}',
      NOW()
    )
    RETURNING *;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0];
  }


  // Order Methods
  async getAllOrders(): Promise<Order[]> {
    const query = `
    SELECT *
    FROM bouquetbar.orders;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows;
  }


  async getOrder(id: string): Promise<Order | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.orders
    WHERE id = '${id}'
    LIMIT 1;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();
    const query = `
    INSERT INTO bouquetbar.orders (
      customername,
      email,
      phone,
      occasion,
      requirements,
      status,
      items,
      total,
      userid,
      deliveryaddress,
      deliverydate,
      subtotal,
      deliveryoptionid,
      deliverycharge,
      couponcode,
      discountamount,
      shippingaddressid,
      ordernumber,
      paymentmethod,
      paymentcharges,
      paymentstatus,
      paymenttransactionid,
      estimateddeliverydate,
      updatedat,
      statusupdatedat,
      pointsawarded,
      createdat
    ) VALUES (
      '${order.customerName}',
      '${order.email}',
      '${order.phone}',
      '${order.occasion ?? ''}',
      '${order.requirements ?? ''}',
      'pending',
      '${JSON.stringify(order.items)}',
      ${order.total},
      '${order.userId ?? ''}',
      '${order.deliveryAddress ?? ''}',
      '${order.deliveryDate ?? ''}',
      ${order.subtotal},
      '${order.deliveryOptionId ?? ''}',
      ${order.deliveryCharge ?? 0},
      '${order.couponCode ?? ''}',
      ${order.discountAmount ?? 0},
      '${order.shippingAddressId ?? ''}',
      '${orderNumber}',
      '${order.paymentMethod}',
      ${order.paymentCharges ?? 0},
      'pending',
      '${order.paymentTransactionId ?? ''}',
      '${order.estimatedDeliveryDate ?? ''}',
      NOW(),
      NOW(),
      ${order.pointsAwarded ?? false},
      NOW()
    )
    RETURNING *;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0];
  }


  // Enrollment Methods
  async getAllEnrollments(): Promise<Enrollment[]> {
    const query = `
    SELECT *
    FROM bouquetbar.enrollments;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows;
  }


  async getEnrollment(id: string): Promise<Enrollment | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.enrollments
    WHERE id = '${id}'
    LIMIT 1;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }


  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const query = `
    INSERT INTO bouquetbar.enrollments (
      fullname,
      email,
      phone,
      courseid,
      batch,
      questions,
      status,
      createdat
    ) VALUES (
      '${enrollment.fullName}',
      '${enrollment.email}',
      '${enrollment.phone}',
      '${enrollment.courseId}',
      '${enrollment.batch ?? ''}',
      '${enrollment.questions ?? ''}',
      'pending',
      NOW()
    )
    RETURNING *;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0];
  }

  // Testimonial Methods
  // Get testimonials by type
  async getTestimonialsByType(type: string): Promise<Testimonial[]> {
    const query = `
    SELECT *
    FROM bouquetbar.testimonials
    WHERE type = '${type}';
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }

  // Get all testimonials
  async getAllTestimonials(): Promise<Testimonial[]> {
    const query = `
    SELECT *
    FROM bouquetbar.testimonials;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const query = `
    INSERT INTO bouquetbar.testimonials (
      name,
      location,
      rating,
      comment,
      type,
      image,
      createdat
    ) VALUES (
      '${testimonial.name}',
      '${testimonial.location}',
      ${testimonial.rating},
      '${testimonial.comment}',
      '${testimonial.type}',
      '${testimonial.image ?? ''}',
      NOW()
    )
    RETURNING *;
  `;

    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0];
  }

  // Blog Post Methods
  async getAllBlogPosts(): Promise<BlogPost[]> {
    const query = `
    SELECT *
    FROM bouquetbar.blog_posts;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query Result:', result.rows);
    return result.rows;
  }


  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.blog_posts
    WHERE id = '${id}'
    LIMIT 1;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const query = `
    INSERT INTO bouquetbar.blog_posts (
      title,
      excerpt,
      content,
      category,
      image,
      published_at,
      created_at
    ) VALUES (
      '${post.title}',
      '${post.excerpt}',
      '${post.content}',
      '${post.category}',
      '${post.image}',
      NOW(),
      NOW()
    )
    RETURNING *;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows[0];
  }


  // Cart Methods
  async getUserCart(userId: string): Promise<(Cart & { product: Product })[]> {
    const query = `
    SELECT c.*, p.*
    FROM bouquetbar.carts c
    INNER JOIN bouquetbar.products p ON c.productid = p.id
    WHERE c.userid = '${userId}';
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows;
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    const checkQuery = `
    SELECT *
    FROM bouquetbar.carts
    WHERE userid = '${userId}' AND productid = '${productId}'
    LIMIT 1;
  `;
    const existing = await db.query(checkQuery);

    if (existing.rows[0]) {
      const updateQuery = `
      UPDATE bouquetbar.carts
      SET quantity = quantity + ${quantity}, updatedat = NOW()
      WHERE userid = '${userId}' AND productid = '${productId}'
      RETURNING *;
    `;
      const result = await db.query(updateQuery);
      return result.rows[0];
    }

    const insertQuery = `
    INSERT INTO bouquetbar.carts (userid, productid, quantity, createdat, updatedat)
    VALUES ('${userId}', '${productId}', ${quantity}, NOW(), NOW())
    RETURNING *;
  `;
    const result = await db.query(insertQuery);
    return result.rows[0];
  }

  async updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const query = `
    UPDATE bouquetbar.carts
    SET quantity = ${quantity}, updatedat = NOW()
    WHERE userid = '${userId}' AND productid = '${productId}'
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }


  async removeFromCart(userId: string, productId: string): Promise<void> {
    const query = `
    DELETE FROM bouquetbar.carts
    WHERE userid = '${userId}' AND productid = '${productId}';
  `;
    await db.query(query);
  }


  async clearUserCart(userId: string): Promise<void> {
    const query = `
    DELETE FROM bouquetbar.carts
    WHERE userid = '${userId}';
  `;
    await db.query(query);
  }

  // Order Status Methods
  async getUserOrders(userId: string): Promise<Order[]> {
    const query = `
    SELECT *
    FROM bouquetbar.orders
    WHERE userid = '${userId}';
  `;
    const result = await db.query(query);
    return result.rows;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.orders
    WHERE ordernumber = '${orderNumber}'
    LIMIT 1;
  `;
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string, transactionId?: string): Promise<Order> {
    const query = `
    UPDATE bouquetbar.orders
    SET paymentstatus = '${paymentStatus}',
        paymenttransactionid = ${transactionId ? `'${transactionId}'` : 'NULL'},
        updatedat = NOW()
    WHERE id = '${id}'
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }


  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `BBORD${year}${month}${day}`;

    const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(ordernumber FROM '${datePrefix}(\\d+)') AS INTEGER)), 0) AS maxordernum
    FROM bouquetbar.orders
    WHERE ordernumber LIKE '${datePrefix}%'
      AND createdat >= '${now.toISOString().slice(0, 10)} 00:00:00'
      AND createdat < '${now.toISOString().slice(0, 10)} 23:59:59';
  `;

    const result = await db.query(query);
    const maxOrderNum = result.rows[0].maxordernum || 0;
    const nextNumber = String(maxOrderNum + 1).padStart(4, '0');
    return `${datePrefix}${nextNumber}`;
  }


  //PROCESS TO CHECK THE ALL DATA - Removed duplicate method

  async validateCartItems(items: Array<{ productId?: string; quantity?: number; unitPrice?: number; productName?: string; totalPrice?: number }>): Promise<{
    isValid: boolean;
    errors?: string[];
    validatedItems?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }>;
  }> {
    const errors: string[] = [];
    const validatedItems: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }> = [];
    for (const item of items) {
      // Validate required fields
      if (!item.productId) {
        errors.push(`Product ID is required`);
        continue;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Valid quantity is required`);
        continue;
      }
      
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Valid unit price is required`);
        continue;
      }

      const query = `
        SELECT * FROM bouquetbar.products
        WHERE id = '${item.productId}'
        LIMIT 1;
      `;
      const result = await db.query(query);
      const product = result.rows[0];

      if (!product) {
        errors.push(`Product with ID ${item.productId} not found`);
        continue;
      }

      if (!product.inStock) {
        errors.push(`Product ${product.name} is out of stock`);
        continue;
      }

      if (product.stockquantity < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.stockquantity}`);
        continue;
      }

      const currentPrice = parseFloat(product.price);
      if (Math.abs(currentPrice - item.unitPrice) > 0.01) {
        errors.push(`Price mismatch for ${product.name}. Current: ${currentPrice}, Provided: ${item.unitPrice}`);
        continue;
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      validatedItems: errors.length === 0 ? validatedItems : undefined
    };
  }

  async calculateOrderPricing(subtotal: number, deliveryOptionId: string, couponCode?: string, paymentMethod?: string): Promise<{
    subtotal: number;
    deliveryCharge: number;
    discountAmount: number;
    paymentCharges: number;
    total: number;
  }> {
    // ✅ Delivery option
    const deliveryQuery = `
      SELECT * FROM bouquetbar.delivery_options
      WHERE id = '${deliveryOptionId}'
      LIMIT 1;
    `;
    const deliveryResult = await db.query(deliveryQuery);
    const deliveryOption = deliveryResult.rows[0];
    const deliveryCharge = deliveryOption ? parseFloat(deliveryOption.price) : 0;

    // ✅ Coupon discount
    let discountAmount = 0;
    if (couponCode) {
      const couponQuery = `
        SELECT * FROM bouquetbar.coupons
        WHERE code = '${couponCode}'
        AND isactive = true
        LIMIT 1;
      `;
      const couponResult = await db.query(couponQuery);
      const coupon = couponResult.rows[0];

      if (coupon) {
        if (coupon.type === "percentage") {
          discountAmount = (subtotal * parseFloat(coupon.value)) / 100;
          if (coupon.maxdiscount) {
            discountAmount = Math.min(discountAmount, parseFloat(coupon.maxdiscount));
          }
        } else if (coupon.type === "fixed") {
          discountAmount = parseFloat(coupon.value);
        }
      }
    }

    // ✅ Payment charges
    let paymentCharges = 0;
    if (paymentMethod === "Card" || paymentMethod === "Online") {
      paymentCharges = Math.max((subtotal + deliveryCharge - discountAmount) * 0.02, 5);
    }

    const total = subtotal + deliveryCharge - discountAmount + paymentCharges;

    return { subtotal, deliveryCharge, discountAmount, paymentCharges, total };
  }



  async awardUserPoints(userId: string, points: number): Promise<void> {
    const query = `
    UPDATE bouquetbar.users
    SET points = COALESCE(points, 0) + ${points},
        updatedat = NOW()
    WHERE id = '${userId}';
  `;
    await db.query(query);
  }

  /**
   * List orders that are eligible for status advancement based on their current status and time
   */
  async listAdvancableOrders(cutoffDate: Date, statuses: string[]) {
    const statusesList = statuses.map(s => `'${s}'`).join(',');
    const query = `
    SELECT *
    FROM bouquetbar.orders
    WHERE status IN (${statusesList})
      AND (statusupdatedat <= '${cutoffDate.toISOString()}' OR statusupdatedat IS NULL)
      AND createdat <= '${cutoffDate.toISOString()}'
    ORDER BY createdat;
  `;
    const result = await db.query(query);
    return result.rows;
  }


  /**
   * Advance an order's status to the next state
   */
  async advanceOrderStatus(orderId: string, nextStatus: string) {
    const now = new Date();

    const query = `
    UPDATE bouquetbar.orders
    SET status = '${nextStatus}',
        statusupdatedat = NOW(),
        updatedat = NOW()
    WHERE id = '${orderId}'
    RETURNING *;
  `;
    const result = await db.query(query);
    const order = result.rows[0];

    if (nextStatus === "processing" && order.user_id) {
      await this.awardUserPoints(order.user_id, 50);
    }

    await this.addOrderStatusHistory(orderId, nextStatus, "Status automatically updated");
    return order;
  }


  async getOrderStatusHistory(orderId: string) {
    const query = `
    SELECT *
    FROM bouquetbar.order_status_history
    WHERE order_id = '${orderId}'
    ORDER BY changedat;
  `;
    const result = await db.query(query);
    return result.rows;
  }

  async addOrderStatusHistory(orderId: string, status: string, note?: string) {
    const query = `
    INSERT INTO bouquetbar.order_status_history (order_id, status, note, changed_at)
    VALUES ('${orderId}', '${status}', ${note ? `'${note}'` : 'NULL'}, NOW());
  `;
    await db.query(query);
  }


  async validateStockAvailability(items: Array<{ productId: string; quantity: number }>) {
    const errors: string[] = [];
    const stockValidation: any[] = [];

    for (const item of items) {
      const query = `
      SELECT *
      FROM bouquetbar.products
      WHERE id = '${item.productId}'
      LIMIT 1;
    `;
      const result = await db.query(query);
      const product = result.rows[0];

      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      const sufficient = product.stock_quantity >= item.quantity;
      stockValidation.push({
        productId: item.productId,
        productName: product.name,
        requiredQuantity: item.quantity,
        availableStock: product.stock_quantity,
        sufficient
      });

      if (!sufficient) {
        errors.push(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.stock_quantity}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      stockValidation
    };
  }

  async decrementProductsStock(items: Array<{ productId: string; quantity: number }>) {
    for (const item of items) {
      const query = `
      UPDATE bouquetbar.products
      SET stockquantity = stockquantity - ${item.quantity},
          updated_at = NOW()
      WHERE id = '${item.productId}';
    `;
      await db.query(query);
    }
  }

  async cancelOrder(orderId: string, userId?: string) {
    try {
      // First get the order to verify ownership if userId is provided
      if (userId) {
        const orderCheck = await db.query(`
          SELECT * FROM bouquetbar.orders 
          WHERE id = '${orderId}' AND userid = '${userId}'
          LIMIT 1;
        `);
        
        if (!orderCheck.rows.length) {
          throw new Error("Order not found or access denied");
        }
        
        const order = orderCheck.rows[0];
        if (order.status === 'delivered' || order.status === 'cancelled') {
          throw new Error(`Order cannot be cancelled as it is already ${order.status}`);
        }
      }

      const query = `
        UPDATE bouquetbar.orders
        SET status = 'cancelled',
            statusupdated_at = NOW(),
            updatedat = NOW()
        WHERE id = '${orderId}'
        RETURNING *;
      `;
      const result = await db.query(query);
      
      if (!result.rows[0]) {
        throw new Error("Order not found");
      }
      
      await this.addOrderStatusHistory(orderId, "cancelled", "Order cancelled");
      return result.rows[0];
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      throw error;
    }
  }

  async incrementCouponUsage(code: string): Promise<Coupon> {
    const query = `
      UPDATE bouquetbar.coupons
      SET timesused = timesused + 1, updatedat = NOW()
      WHERE code = '${code}'
      RETURNING *;
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async deleteCoupon(id: string): Promise<void> {
    const query = `
      DELETE FROM bouquetbar.coupons
      WHERE id = '${id}';
    `;
    await db.query(query);
  }

  async getAllDeliveryOptions(): Promise<DeliveryOption[]> {
    const query = `
      SELECT *
      FROM bouquetbar.delivery_options
      ORDER BY sortorder;
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getDeliveryOption(id: string): Promise<DeliveryOption | undefined> {
    const query = `
      SELECT *
      FROM bouquetbar.delivery_options
      WHERE id = '${id}'
      LIMIT 1;
    `;
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }


  async updateOrderAddress(orderId: string, addressId: string): Promise<Order> {
    const query = `
    UPDATE bouquetbar.orders
    SET addressid = '${addressId}', updatedat = NOW()
    WHERE id = '${orderId}'
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async getUserFavorites(userId: string): Promise<(Favorite & { product: Product })[]> {
    const query = `
    SELECT 
      f.id,
      f.userid,
      f.productid,
      f.createdat,
      p.*
    FROM bouquetbar.favorites f
    INNER JOIN bouquetbar.products p
      ON f.productid = p.id
    WHERE f.userid = '${userId}';
  `;
    console.log("Executing query:", query);
    const result = await db.query(query);
    console.log("Query Result:", result.rows);

    return result.rows as (Favorite & { product: Product })[];
  }

  async addToFavorites(userId: string, productId: string): Promise<Favorite> {
    const query = `
    INSERT INTO bouquetbar.favorites (userid, productid)
    VALUES ('${userId}', '${productId}')
    RETURNING *;
  `;

    console.log("Executing query:", query);
    const result = await db.query(query);
    console.log("Inserted Favorite:", result.rows[0]);

    return result.rows[0] as Favorite;
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    const query = `
    DELETE FROM bouquetbar.favorites
    WHERE userid = '${userId}' AND productid = '${productId}';
  `;

    console.log("Executing query:", query);
    await db.query(query);
    console.log(`Removed favorite for user: ${userId}, product: ${productId}`);
  }

  async isProductFavorited(userId: string, productId: string): Promise<boolean> {
    const query = `
    SELECT 1
    FROM bouquetbar.favorites
    WHERE userid = '${userId}' AND productid = '${productId}'
    LIMIT 1;
  `;
    console.log("Executing query:", query);
    const result = await db.query(query);
    console.log("Is Favorited:", (result.rowCount ?? 0) > 0);

    return (result.rowCount ?? 0) > 0;
  }


  // Main entry point: handles end-to-end order placement
  async processOrderPlacement(
    orderData: OrderPlacement,
    userId?: string
  ): Promise<{
    isValid: boolean;
    errors?: string[];
    order?: Order;
    calculatedPricing?: {
      subtotal: number;
      deliveryCharge: number;
      discountAmount: number;
      paymentCharges: number;
      total: number;
    };
  }> {
    try {
      // Step 1: Validate the order
      const validation = await this.validateAndProcessOrder(orderData);
      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors
        };
      }

      // Step 2: Create order inside transaction
      const createdOrder = await this.createOrderWithTransaction(
        validation.validatedOrder!,
        orderData.couponCode,
        userId
      );

      return {
        isValid: true,
        order: createdOrder,
        calculatedPricing: validation.calculatedPricing
      };
    } catch (error) {
      console.error("[ORDER PROCESSING ERROR]:", error);
      return {
        isValid: false,
        errors: ["Failed to process order placement"]
      };
    }
  }

  async validateAndProcessOrder(orderData: OrderPlacement): Promise<{
    isValid: boolean;
    errors?: string[];
    validatedOrder?: InsertOrder;
    calculatedPricing?: {
      subtotal: number;
      deliveryCharge: number;
      discountAmount: number;
      paymentCharges: number;
      total: number;
    };
  }> {
    const errors: string[] = [];

    // ✅ 1. Validate cart items
    const cartValidation = await this.validateCartItems(orderData.items);
    if (!cartValidation.isValid) {
      errors.push(...(cartValidation.errors || []));
    }

    // ✅ 2. Validate delivery option
    const queryDelivery = `
      SELECT *
      FROM bouquetbar.delivery_options
      WHERE id = '${orderData.deliveryOptionId}'
      LIMIT 1;
    `;
    const deliveryResult = await db.query(queryDelivery);
    const deliveryOption = deliveryResult.rows[0];
    if (!deliveryOption) {
      errors.push("Invalid delivery option");
    }

    // ✅ 3. Validate shipping address if user is logged in
    if (orderData.userId && orderData.shippingAddressId) {
      const queryAddress = `
        SELECT *
        FROM bouquetbar.addresses
        WHERE id = '${orderData.shippingAddressId}' 
          AND userid = '${orderData.userId}'
                  AND isactive=true
        LIMIT 1;
      `;
      const addressResult = await db.query(queryAddress);
      const address = addressResult.rows[0];
      if (!address) {
        errors.push("Invalid shipping address");
      }
    }

    // ❌ Stop if errors found
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // ✅ 4. Calculate pricing (server-side check)
    const calculatedPricing = await this.calculateOrderPricing(
      orderData.subtotal,
      orderData.deliveryOptionId,
      orderData.couponCode,
      orderData.paymentMethod
    );

    // ✅ 5. Validate pricing consistency with tolerance
    const tolerance = 0.01;
    if (Math.abs(calculatedPricing.deliveryCharge - orderData.deliveryCharge) > tolerance) {
      errors.push("Delivery charge mismatch");
    }
    if (Math.abs(calculatedPricing.discountAmount - orderData.discountAmount) > tolerance) {
      errors.push("Discount amount mismatch");
    }
    if (Math.abs(calculatedPricing.total - orderData.total) > tolerance) {
      errors.push("Total amount mismatch");
    }

    // ❌ Stop if errors found
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // ✅ 6. Construct validated order object
    const validatedOrder: InsertOrder = {
      userId: orderData.userId,
      customerName: orderData.customerName,
      email: orderData.email,
      phone: orderData.phone,
      occasion: orderData.occasion,
      requirements: orderData.requirements,
      items: cartValidation.validatedItems!,
      subtotal: orderData.subtotal.toString(),
      deliveryOptionId: orderData.deliveryOptionId,
      deliveryCharge: calculatedPricing.deliveryCharge.toString(),
      couponCode: orderData.couponCode,
      discountAmount: calculatedPricing.discountAmount.toString(),
      paymentMethod: orderData.paymentMethod,
      paymentCharges: calculatedPricing.paymentCharges.toString(),
      total: calculatedPricing.total.toString(),
      shippingAddressId: orderData.shippingAddressId,
      deliveryAddress: orderData.deliveryAddress,
      deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
      estimatedDeliveryDate: deliveryOption
        ? new Date(
          Date.now() +
          parseInt(deliveryOption.estimateddays.split('-')[0]) * 24 * 60 * 60 * 1000
        )
        : undefined,
    };

    // ✅ 7. Return successful validation
    return {
      isValid: true,
      validatedOrder,
      calculatedPricing,
    };
  }


  async createOrderWithTransaction(
    validatedOrder: InsertOrder,
    couponCode?: string,
    userId?: string
  ): Promise<Order> {
    try {
      // 1️⃣ Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 2️⃣ Validate userId if provided
      let validUserId: string | null = null, username: string | null = null;
      if (userId) {
        const userCheck = await db.query(`
        SELECT id, firstname FROM bouquetbar.users WHERE id = '${userId}';
      `);
        if (!userCheck.rows.length) {
          throw new Error(`User with ID ${userId} does not exist.`);
        }
        validUserId = userId;
        username = userCheck.rows[0].firstname;
      }

      console.log("Creating order for user:", validUserId);
      console.log("Username:", username);
      // 3️⃣ Insert order
      const insertOrderQuery = `
      INSERT INTO bouquetbar.orders (
        customername,
        email,
        phone,
        occasion,
        requirements,
        status,
        items,
        total,
        createdat,
        userid,
        deliveryaddress,
        deliverydate,
        subtotal,
        deliverycharge,
        couponcode,
        discountamount,
        shippingaddressid,
        ordernumber,
        paymentmethod,
        paymentcharges,
        paymentstatus,
        paymenttransactionid,
        estimateddeliverydate,
        updatedat,
        statusupdated_at,
        pointsawarded
      ) VALUES (
        '${username || validatedOrder.customerName || ''}',
        '${validatedOrder.email}',
        '${validatedOrder.phone}',
        '${validatedOrder.occasion || ""}',
        '${validatedOrder.requirements || ""}',
        'pending',
        '${JSON.stringify(validatedOrder.items)}',
        ${validatedOrder.total},
        NOW(),
        ${validUserId ? `'${validUserId}'` : "NULL"},
        '${validatedOrder.deliveryAddress || ""}',
        ${validatedOrder.deliveryDate ? `'${(validatedOrder.deliveryDate as Date).toISOString()}'` : "NULL"},
        ${validatedOrder.subtotal},
        ${validatedOrder.deliveryCharge || 0},
        '${couponCode || ""}',
        ${validatedOrder.discountAmount || 0},
        ${validatedOrder.shippingAddressId ? `'${validatedOrder.shippingAddressId}'` : "NULL"},
        '${orderNumber}',
        '${validatedOrder.paymentMethod || 'Cash'}',
        ${validatedOrder.paymentCharges || 0},
        'pending',
        '${validatedOrder.paymentTransactionId || ""}',
        ${validatedOrder.estimatedDeliveryDate ? `'${(validatedOrder.estimatedDeliveryDate as Date).toISOString()}'` : "NULL"},
        NOW(),
        NOW(),
        ${validatedOrder.pointsAwarded ? "true" : "false"}
      )
      RETURNING *;
    `;

      console.log('Executing insert order query:', insertOrderQuery);
      const result = await db.query(insertOrderQuery);

      // 4️⃣ Decrement product stock
      const orderItems = validatedOrder.items as Array<{ productId: string; quantity: number }>;
      for (const item of orderItems) {
        const stockQuery = `
        UPDATE bouquetbar.products
        SET 
          stockquantity = CAST(stockquantity AS INTEGER) - ${item.quantity}
        WHERE id = '${item.productId}' AND CAST(stockquantity AS INTEGER) >= ${item.quantity}
        RETURNING id, name, stockquantity;
      `;
        console.log('Executing stock decrement query:', stockQuery);
        const stockResult = await db.query(stockQuery);

        if (!stockResult.rows || stockResult.rows.length === 0) {
          throw new Error(`Insufficient stock for Product ID ${item.productId}`);
        }
      }

      // 5️⃣ Increment coupon usage
      if (couponCode) {
        const couponQuery = `
        UPDATE bouquetbar.coupons
        SET timesused = timesused + 1, updatedat = NOW()
        WHERE code = '${couponCode}';
      `;
        await db.query(couponQuery);
      }

      // 6️⃣ Clear user cart
      if (validUserId) {
        const cartQuery = `
        DELETE FROM bouquetbar.carts
        WHERE userid = '${validUserId}';
      `;
        await db.query(cartQuery);
      }

      return result.rows[0];
    } catch (error) {
      console.error("[ORDER ERROR] Order creation failed:", error);
      throw error;
    }
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    try {
      // ✅ If default, unset other default addresses first
      if (address.isDefault) {
        const unsetQuery = `
          UPDATE bouquetbar.addresses
          SET isdefault = false, updatedat = NOW()
          WHERE userid = '${address.userId}' AND isdefault = true;
        `;
        await db.query(unsetQuery);
      }

      // ✅ Insert new address
      const insertQuery = `
        INSERT INTO bouquetbar.addresses 
          (userid, fullname, phone, email, addressline1, addressline2, landmark, city, state, postalcode, country, addresstype, isdefault, createdat, updatedat)
        VALUES 
          (
            '${address.userId}', 
            '${address.fullName}', 
            '${address.phone}', 
            ${address.email ? `'${address.email}'` : 'NULL'}, 
            '${address.addressLine1}', 
            ${address.addressLine2 ? `'${address.addressLine2}'` : 'NULL'}, 
            ${address.landmark ? `'${address.landmark}'` : 'NULL'}, 
            '${address.city}', 
            '${address.state}', 
            '${address.postalCode}', 
            '${address.country || 'India'}', 
            '${address.addressType || 'Home'}', 
            ${address.isDefault ? 'true' : 'false'}, 
            NOW(), 
            NOW()
          )
        RETURNING *;
      `;

      const result = await db.query(insertQuery);
      return result.rows[0];
    } catch (error) {
      console.error("Error in createAddress:", error);
      throw new Error(`Failed to insert address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      // 1️⃣ Remove default from all addresses of this user
      const unsetQuery = `
      UPDATE bouquetbar.addresses
      SET isdefault = false, updatedat = NOW()
      WHERE userid = '${userId}' AND isdefault = true AND isactive=true
    `;
      await db.query(unsetQuery);

      // 2️⃣ Set the new default address
      const setQuery = `
      UPDATE bouquetbar.addresses
      SET isdefault = true, updatedat = NOW()
      WHERE id = '${addressId}' AND userid = '${userId}' AND isactive=true;
    `;
      await db.query(setQuery);

    } catch (error) {
      console.error("Error in setDefaultAddress:", error);
      throw new Error(
        `Failed to set default address: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }



  async createDeliveryOption(option: {
    name: string;
    description: string;
    estimatedDays: string;
    price: string;
    isActive: boolean;
    sortOrder: number;
  }): Promise<DeliveryOption> {
    try {
      const query = `
      INSERT INTO bouquetbar.delivery_options 
        (name, description, estimateddays, price, isactive, sortorder, createdat) 
      VALUES (
        '${option.name}',
        '${option.description}',
        '${option.estimatedDays}',
        ${option.price},
        ${option.isActive},
        ${option.sortOrder},
        NOW()
      )
      RETURNING *;
    `;

      console.log("Executing query:", query);
      const result = await db.query(query);

      return result.rows[0];
    } catch (error) {
      console.error("Error in createDeliveryOption:", error);
      throw new Error(
        `Failed to create delivery option: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }


  async getUserAddresses(userId: string): Promise<Address[]> {
    const query = `
    SELECT *
    FROM bouquetbar.addresses
    WHERE userid = '${userId}'
            AND isactive=true
    ORDER BY createdat;
  `;
    const result = await db.query(query);
    return result.rows;
  }

  async deleteAddress(id: string): Promise<void> {
    const query = `
    UPDATE bouquetbar.addresses
    SET isactive = false, updatedat = NOW() 
    WHERE id = '${id}' AND isactive=true;
  `;
    await db.query(query);
  }

  async getAddress(id: string): Promise<Address | undefined> {
    try {
      if (!id) {
        throw new Error("Address ID is required");
      }
      const query = `
      SELECT *
      FROM bouquetbar.addresses
      WHERE id = '${id}'
        AND isactive=true
      LIMIT 1;
    `;
      console.log("Executing query:", query);
      const result = await db.query(query);
      console.log("Query Result:", result.rows || "No address found");

      return result.rows[0] || undefined;
    } catch (error) {
      console.error("Error in getAddress:", error);
      throw new Error(
        `Failed to get address: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }



  async getActiveDeliveryOptions(): Promise<DeliveryOption[]> {
    const query = `
    SELECT *
    FROM bouquetbar.delivery_options
    WHERE isactive = true
    ORDER BY sortorder;
  `;
    const result = await db.query(query);
    return result.rows;
  }


  async addFavorite(userId: string, productId: string): Promise<Favorite> {
    const query = `
    INSERT INTO bouquetbar.favorites (userid, productid, createdat)
    VALUES ('${userId}', '${productId}', NOW())
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }


  async removeFavorite(userId: string, productId: string): Promise<void> {
    const query = `
    DELETE FROM bouquetbar.favorites
    WHERE userid = '${userId}' AND productid = '${productId}';
  `;
    await db.query(query);
  }


  async getFavorites(userId: string): Promise<(Favorite & { product: Product })[]> {
    const query = `
    SELECT f.*, p.*
    FROM bouquetbar.favorites f
    INNER JOIN bouquetbar.products p ON f.productid = p.id
    WHERE f.userid = '${userId}'
    ORDER BY f.createdat;
  `;
    const result = await db.query(query);
    return result.rows;
  }


  async addCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const query = `
    INSERT INTO bouquetbar.coupons (code, type, value, maxdiscount, minordervalue, expiresat, createdat)
    VALUES ('${coupon.code}', '${coupon.type}', ${coupon.value}, ${coupon.maxDiscount || 0}, ${coupon.minOrderAmount || 0}, ${coupon.expiresAt ? `'${coupon.expiresAt}'` : 'NULL'}, NOW())
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }


  async getCoupon(code: string): Promise<Coupon | undefined> {
    const query = `
    SELECT *
    FROM bouquetbar.coupons
    WHERE code = '${code}'
    LIMIT 1;
  `;
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const normalizedCode = code.trim().toUpperCase();
    const query = `
    SELECT *
    FROM bouquetbar.coupons
    WHERE UPPER(code) = '${normalizedCode}'
    LIMIT 1;
  `;
    const result = await db.query(query);
    return result.rows[0] || undefined;
  }

  async getAllCoupons(): Promise<Coupon[]> {
    const query = `
    SELECT *
    FROM bouquetbar.coupons
    ORDER BY createdat DESC;
  `;
    const result = await db.query(query);
    return result.rows;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const query = `
    INSERT INTO bouquetbar.coupons (code, type, value, maxdiscount, minordervalue, expiresat, createdat)
    VALUES ('${coupon.code}', '${coupon.type}', ${coupon.value}, ${coupon.maxDiscount || 0}, ${coupon.minOrderAmount || 0}, ${coupon.expiresAt ? `'${coupon.expiresAt}'` : 'NULL'}, NOW())
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const updateFields: string[] = [];
    if (updates.code) updateFields.push(`code = '${updates.code}'`);
    if (updates.type) updateFields.push(`type = '${updates.type}'`);
    if (updates.value) updateFields.push(`value = ${updates.value}`);
    if (updates.maxDiscount !== undefined) updateFields.push(`maxdiscount = ${updates.maxDiscount}`);
    if (updates.minOrderAmount !== undefined) updateFields.push(`minordervalue = ${updates.minOrderAmount}`);
    if (updates.expiresAt) updateFields.push(`expiresat = '${updates.expiresAt}'`);
    updateFields.push(`updatedat = NOW()`);

    const query = `
    UPDATE bouquetbar.coupons
    SET ${updateFields.join(', ')}
    WHERE id = '${id}'
    RETURNING *;
  `;
    const result = await db.query(query);
    return result.rows[0];
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    try {
      const updateFields: string[] = [];
      if (updates.fullName) updateFields.push(`fullname = '${updates.fullName}'`);
      if (updates.phone) updateFields.push(`phone = '${updates.phone}'`);
      if (updates.email) updateFields.push(`email = '${updates.email}'`);
      if (updates.addressLine1) updateFields.push(`addressline1 = '${updates.addressLine1}'`);
      if (updates.addressLine2 !== undefined) updateFields.push(`addressline2 = ${updates.addressLine2 ? `'${updates.addressLine2}'` : 'NULL'}`);
      if (updates.landmark !== undefined) updateFields.push(`landmark = ${updates.landmark ? `'${updates.landmark}'` : 'NULL'}`);
      if (updates.city) updateFields.push(`city = '${updates.city}'`);
      if (updates.state) updateFields.push(`state = '${updates.state}'`);
      if (updates.postalCode) updateFields.push(`postalcode = '${updates.postalCode}'`);
      if (updates.country) updateFields.push(`country = '${updates.country}'`);
      if (updates.addressType) updateFields.push(`addresstype = '${updates.addressType}'`);
      if (updates.isDefault !== undefined) updateFields.push(`isdefault = ${updates.isDefault}`);
      
      updateFields.push(`updatedat = NOW()`);

      const query = `
        UPDATE bouquetbar.addresses
        SET ${updateFields.join(', ')}
        WHERE id = '${id}' AND isactive = true
        RETURNING *;
      `;
      
      const result = await db.query(query);
      if (!result.rows[0]) {
        throw new Error(`Address with id ${id} not found`);
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in updateAddress:', error);
      throw new Error(`Failed to update address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async validateCoupon(code: string, orderSubtotal: number): Promise<{
    isValid: boolean;
    discount?: number;
    error?: string;
  }> {
    const coupon = await this.getCoupon(code);

    if (!coupon) {
      return { isValid: false, error: "Invalid coupon code" };
    }

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { isValid: false, error: "Coupon has expired" };
    }

    if (coupon.minOrderAmount && orderSubtotal < parseFloat(coupon.minOrderAmount)) {
      return {
        isValid: false,
        error: `Order subtotal must be at least ${coupon.minOrderAmount} to use this coupon`
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (orderSubtotal * parseFloat(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, parseFloat(coupon.maxDiscount));
      }
    } else {
      discount = Math.min(parseFloat(coupon.value), orderSubtotal);
    }

    return { isValid: true, discount };
  }


  async getCourses(): Promise<any[]> {
    const query = `
        SELECT * FROM 
      bouquetbar.courses
      ORDER BY created_at DESC ;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    console.log('Query executed successfully');
    return result.rows || [];
  }

  async getEvents(): Promise<Event[]> {
    const query = `
    SELECT *
    FROM bouquetbar.events
    ORDER BY 1 ASC;
  `;
    console.log('Executing query:', query);
    const result = await db.query(query);
    return result.rows || [];
  }


  async addEventEnrollment(enrollment: {
    eventId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    paymentMethod: string;
    paymentAmount: number;
    transactionId?: string;
  }): Promise<any> {
    try {
        // First verify if the event exists
        const checkEventQuery = 'SELECT id FROM bouquetbar.events WHERE id = $1';
        const eventResult = await db.query(checkEventQuery, [enrollment.eventId]);
        
        if (eventResult.rows.length === 0) {
            throw new Error('Event not found');
        }

        // Insert the enrollment
        const query = `
            INSERT INTO bouquetbar.events_enrollments (
                event_id,
                first_name,
                last_name,
                email,
                phone,
                payment_status,
                payment_amount,
                transaction_id,
                enrolled_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
            ) RETURNING *
        `;
        const values = [
            enrollment.eventId,
            enrollment.firstName,
            enrollment.lastName,
            enrollment.email,
            enrollment.phone,
            enrollment.paymentMethod === 'online' ? 'completed' : 'pending',
            enrollment.paymentAmount,
            enrollment.transactionId || null
        ];

        console.log('Executing enrollment query with values:', values);
        const result = await db.query(query, values);
      console.log('Insert Result:', result.rows);
      return result.rows[0];
    } catch (error) {
        console.error('Error in addEventEnrollment:', error);
        throw error;
    }
  }




   async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      await db.query('BEGIN');
      try {
        const updateQuery = `
          UPDATE bouquetbar.orders
          SET 
            status = $1, 
            statusupdated_at = NOW(), 
            updatedat = NOW()
          WHERE id = $2
          RETURNING *;
        `;
        const result = await db.query(updateQuery, [status, id]);

        if (result.rows.length === 0) {
          throw new Error('Order not found');
        }
        const historyQuery = `
          INSERT INTO bouquetbar.order_status_history 
          (order_id, status, note, changed_at)
          VALUES ($1, $2, $3, NOW());
        `;
        await db.query(historyQuery, [id, status, `Status updated to ${status || 'No Note'}`]);
        if (status === 'delivered') {
          const order = result.rows[0];
          if (order.userid && !order.pointsawarded) {
            const points = Math.floor(parseFloat(order.total) / 100);
            if (points > 0) {
              const updateUserQuery = `
                UPDATE bouquetbar.users
                SET 
                  points = COALESCE(points, 0) + $1,
                  updatedat = NOW()
                WHERE id = $2;
              `;
              await db.query(updateUserQuery, [points, order.userid]);
              await db.query(`
                UPDATE bouquetbar.orders
                SET pointsawarded = true
                WHERE id = $1;
              `, [id]);
            }
          }
        }
        await db.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }


    async AdminClasses(): Promise<any[]> {
    const query = `
        SELECT 
          id,
          title,
          description,
          price,
          duration,
          sessions,
          features,
          popular,
          nextbatch,
          created_at,
          image,
          category
        FROM bouquetbar.courses
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  }

   async AddAdminClasses(classData: any): Promise<any> {
    try {
      const {
        title,
        description,
        price,
        duration,
        sessions,
        features,
        nextbatch,
        image,
        category
      } = classData;

      const query = `
        INSERT INTO bouquetbar.courses(
          title,
          description,
          price,
          duration,
          sessions,
          features,
          popular,
          nextbatch,
          created_at,
          image,
          category
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10
        )
        RETURNING *;
      `;

      const values = [
        title,
        description,
        price,
        duration,
        sessions,
        JSON.stringify(features),
        false, // default value for popular
        nextbatch,
        image,
        category
      ];

      const result = await db.query(query, values);
      console.log('Class added successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding class:', error);
      throw new Error('Failed to add class');
    }
  }


}