import { PrismaClient } from "../generated/prisma/index.js";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  try {
    // ============================================
    // 1. Crear Stores
    // ============================================
    console.log("📦 Creating stores...");
    const store1 = await db.store.upsert({
      where: { id: "store-001" },
      update: {},
      create: {
        id: "store-001",
        name: "Tienda Principal",
        location: "Calle Principal 123, Ciudad",
      },
    });

    const store2 = await db.store.upsert({
      where: { id: "store-002" },
      update: {},
      create: {
        id: "store-002",
        name: "Tienda Secundaria",
        location: "Avenida Secundaria 456, Otra Ciudad",
      },
    });

    console.log(`✅ Created ${2} stores`);

    // ============================================
    // 2. Crear Categorías
    // ============================================
    console.log("🏷️ Creating categories...");
    const categories = await Promise.all([
      db.category.upsert({
        where: { id: "cat-001" },
        update: {},
        create: {
          id: "cat-001",
          name: "Bebidas",
        },
      }),
      db.category.upsert({
        where: { id: "cat-002" },
        update: {},
        create: {
          id: "cat-002",
          name: "Snacks",
        },
      }),
      db.category.upsert({
        where: { id: "cat-003" },
        update: {},
        create: {
          id: "cat-003",
          name: "Lácteos",
        },
      }),
      db.category.upsert({
        where: { id: "cat-004" },
        update: {},
        create: {
          id: "cat-004",
          name: "Frutas y Verduras",
        },
      }),
      db.category.upsert({
        where: { id: "cat-005" },
        update: {},
        create: {
          id: "cat-005",
          name: "Congelados",
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // ============================================
    // 3. Crear Productos
    // ============================================
    console.log("🛍️ Creating products...");
    const products = [];

    // Productos para store1
    products.push(
      await db.product.upsert({
        where: { sku: "SKU-001" },
        update: {},
        create: {
          id: "product-001",
          sku: "SKU-001",
          name: "Coca Cola 2L",
          categoryId: "cat-001",
          storeId: store1.id,
        },
      }),
    );

    products.push(
      await db.product.upsert({
        where: { sku: "SKU-002" },
        update: {},
        create: {
          id: "product-002",
          sku: "SKU-002",
          name: "Doritos Nacho Cheese",
          categoryId: "cat-002",
          storeId: store1.id,
        },
      }),
    );

    products.push(
      await db.product.upsert({
        where: { sku: "SKU-003" },
        update: {},
        create: {
          id: "product-003",
          sku: "SKU-003",
          name: "Leche Integral 1L",
          categoryId: "cat-003",
          storeId: store1.id,
        },
      }),
    );

    products.push(
      await db.product.upsert({
        where: { sku: "SKU-004" },
        update: {},
        create: {
          id: "product-004",
          sku: "SKU-004",
          name: "Manzanas Rojas",
          categoryId: "cat-004",
          storeId: store1.id,
        },
      }),
    );

    products.push(
      await db.product.upsert({
        where: { sku: "SKU-005" },
        update: {},
        create: {
          id: "product-005",
          sku: "SKU-005",
          name: "Pizza Congelada",
          categoryId: "cat-005",
          storeId: store1.id,
        },
      }),
    );

    // Productos para store2
    products.push(
      await db.product.upsert({
        where: { sku: "SKU-006" },
        update: {},
        create: {
          id: "product-006",
          sku: "SKU-006",
          name: "Pepsi 1.5L",
          categoryId: "cat-001",
          storeId: store2.id,
        },
      }),
    );

    products.push(
      await db.product.upsert({
        where: { sku: "SKU-007" },
        update: {},
        create: {
          id: "product-007",
          sku: "SKU-007",
          name: "Papas Lays",
          categoryId: "cat-002",
          storeId: store2.id,
        },
      }),
    );

    console.log(`✅ Created ${products.length} products`);

    // ============================================
    // 4. Crear Usuarios
    // ============================================
    console.log("👥 Creating users...");

    const hashedPassword = await hash("Password123!", 10);

    const user1 = await db.user.upsert({
      where: { email: "gerente@tienda1.com" },
      update: {},
      create: {
        id: "user-001",
        email: "gerente@tienda1.com",
        name: "Carlos García",
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    const user2 = await db.user.upsert({
      where: { email: "empleado@tienda1.com" },
      update: {},
      create: {
        id: "user-002",
        email: "empleado@tienda1.com",
        name: "María López",
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    const user3 = await db.user.upsert({
      where: { email: "gerente@tienda2.com" },
      update: {},
      create: {
        id: "user-003",
        email: "gerente@tienda2.com",
        name: "Juan Rodríguez",
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    console.log(`✅ Created 3 users`);

    // ============================================
    // 4b. Crear StoreMember (Multi-Tenant Relationships)
    // ============================================
    console.log("🔗 Creating store members...");

    // user1 as MANAGER of store1
    await db.storeMember.upsert({
      where: {
        userId_storeId: {
          userId: user1.id,
          storeId: store1.id,
        },
      },
      update: {},
      create: {
        id: "member-001",
        userId: user1.id,
        storeId: store1.id,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });

    // user2 as EMPLOYEE of store1
    await db.storeMember.upsert({
      where: {
        userId_storeId: {
          userId: user2.id,
          storeId: store1.id,
        },
      },
      update: {},
      create: {
        id: "member-002",
        userId: user2.id,
        storeId: store1.id,
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    // user3 as MANAGER of store2
    await db.storeMember.upsert({
      where: {
        userId_storeId: {
          userId: user3.id,
          storeId: store2.id,
        },
      },
      update: {},
      create: {
        id: "member-003",
        userId: user3.id,
        storeId: store2.id,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });

    console.log(`✅ Created 3 store members`);

    // ============================================
    // 5. Crear Batches
    // ============================================
    console.log("📊 Creating batches...");

    const now = new Date();
    const batches = [];

    // Batches activos para store1
    for (let i = 0; i < 10; i++) {
      const productIndex = i % products.slice(0, 5).length;
      const daysUntilExpiry = Math.floor(Math.random() * 60) + 5; // 5-65 días
      const quantity = Math.floor(Math.random() * 100) + 10; // 10-110 unidades
      const costPerUnit = Math.random() * 10 + 2; // $2-12 por unidad

      batches.push(
        await db.batch.upsert({
          where: {
            batchNumber_storeId: {
              batchNumber: `BATCH-${store1.id}-${i.toString().padStart(4, "0")}`,
              storeId: store1.id,
            },
          },
          update: {},
          create: {
            id: `batch-001-${i}`,
            batchNumber: `BATCH-${store1.id}-${i.toString().padStart(4, "0")}`,
            productId: products[productIndex]!.id,
            storeId: store1.id,
            createdById: user1.id,
            quantity,
            costPerUnit,
            totalCost: quantity * costPerUnit,
            expiresAt: new Date(
              now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000,
            ),
            status: "ACTIVE",
            receivedAt: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          },
        }),
      );
    }

    // Batches para store2
    for (let i = 0; i < 8; i++) {
      const productIndex = 5 + (i % 2);
      const daysUntilExpiry = Math.floor(Math.random() * 45) + 3; // 3-47 días
      const quantity = Math.floor(Math.random() * 80) + 15; // 15-95 unidades
      const costPerUnit = Math.random() * 8 + 1.5; // $1.5-9.5 por unidad

      batches.push(
        await db.batch.upsert({
          where: {
            batchNumber_storeId: {
              batchNumber: `BATCH-${store2.id}-${i.toString().padStart(4, "0")}`,
              storeId: store2.id,
            },
          },
          update: {},
          create: {
            id: `batch-002-${i}`,
            batchNumber: `BATCH-${store2.id}-${i.toString().padStart(4, "0")}`,
            productId: products[productIndex]!.id,
            storeId: store2.id,
            createdById: user3.id,
            quantity,
            costPerUnit,
            totalCost: quantity * costPerUnit,
            expiresAt: new Date(
              now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000,
            ),
            status: "ACTIVE",
            receivedAt: new Date(
              now.getTime() - Math.random() * 25 * 24 * 60 * 60 * 1000,
            ),
          },
        }),
      );
    }

    // Batch expirado
    batches.push(
      await db.batch.upsert({
        where: {
          batchNumber_storeId: {
            batchNumber: `BATCH-${store1.id}-EXPIRED`,
            storeId: store1.id,
          },
        },
        update: {},
        create: {
          id: "batch-expired-001",
          batchNumber: `BATCH-${store1.id}-EXPIRED`,
          productId: products[0]!.id,
          storeId: store1.id,
          createdById: user1.id,
          quantity: 45,
          costPerUnit: 3.5,
          totalCost: 45 * 3.5,
          expiresAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Expiró hace 5 días
          status: "EXPIRED",
          receivedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        },
      }),
    );

    console.log(`✅ Created ${batches.length} batches`);

    // ============================================
    // 6. Crear Alertas
    // ============================================
    console.log("🚨 Creating alerts...");

    const alerts = [];

    alerts.push(
      await db.alert.upsert({
        where: { id: "alert-001" },
        update: {},
        create: {
          id: "alert-001",
          type: "LOW_STOCK",
          severity: "WARNING",
          message: "Coca Cola 2L tiene stock bajo",
          productId: products[0]!.id,
          storeId: store1.id,
          isRead: false,
        },
      }),
    );

    alerts.push(
      await db.alert.upsert({
        where: { id: "alert-002" },
        update: {},
        create: {
          id: "alert-002",
          type: "EXPIRING_SOON",
          severity: "CRITICAL",
          message: "Leche Integral expirará en 3 días",
          productId: products[2]!.id,
          storeId: store1.id,
          isRead: false,
        },
      }),
    );

    alerts.push(
      await db.alert.upsert({
        where: { id: "alert-003" },
        update: {},
        create: {
          id: "alert-003",
          type: "EXPIRED",
          severity: "CRITICAL",
          message: "Batch BATCH-store-001-EXPIRED expiró",
          batchId: "batch-expired-001",
          productId: products[0]!.id,
          storeId: store1.id,
          isRead: false,
        },
      }),
    );

    console.log(`✅ Created ${alerts.length} alerts`);

    // ============================================
    // Summary
    // ============================================
    console.log("\n✨ Seed completed successfully!");
    console.log(`
    📦 Stores: ${2}
    🏷️ Categories: ${categories.length}
    🛍️ Products: ${products.length}
    👥 Users: 3
    📊 Batches: ${batches.length}
    🚨 Alerts: ${alerts.length}

    📝 Test Users (Password: Password123!):
    - Manager (Tienda 1): gerente@tienda1.com
    - Employee (Tienda 1): empleado@tienda1.com
    - Manager (Tienda 2): gerente@tienda2.com
    `);
  } catch (error) {
    console.error("❌ Error during seed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
