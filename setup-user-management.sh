#!/bin/bash

# 🚀 User Management System - Script de Setup
# Este script automatiza la configuración del sistema de gestión de usuarios

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "  🚀 Sistema de Gestión de Usuarios - Setup Automático"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
echo -e "${BLUE}1️⃣  Verificando directorio del proyecto...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json no encontrado${NC}"
    echo "Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
fi
echo -e "${GREEN}✅ Estamos en el directorio correcto${NC}"
echo ""

# 2. Verificar Prisma
echo -e "${BLUE}2️⃣  Verificando Prisma CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npm no está disponible${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma CLI disponible${NC}"
echo ""

# 3. Crear migration
echo -e "${BLUE}3️⃣  Creando migración de base de datos...${NC}"
echo "   Ejecutando: npx prisma migrate dev --name add_user_status_and_timestamps"
npx prisma migrate dev --name add_user_status_and_timestamps
echo -e "${GREEN}✅ Migración completada${NC}"
echo ""

# 4. Generar cliente Prisma
echo -e "${BLUE}4️⃣  Regenerando cliente Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Cliente Prisma generado${NC}"
echo ""

# 5. Compilar proyecto
echo -e "${BLUE}5️⃣  Compilando proyecto...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Proyecto compilado exitosamente${NC}"
else
    echo -e "${RED}❌ Error en la compilación${NC}"
    exit 1
fi
echo ""

# 6. Inspiración final
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Setup completado exitosamente!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}📚 Próximos pasos:${NC}"
echo ""
echo "1. Consulta la documentación:"
echo "   - docs/USER_MANAGEMENT_API.md"
echo "   - docs/MIGRATION_USER_MANAGEMENT.md"
echo "   - docs/USER_MANAGEMENT_TECHNICAL_SUMMARY.md"
echo ""
echo "2. Inicia el servidor de desarrollo:"
echo "   npm run dev"
echo ""
echo "3. Prueba los nuevos endpoints:"
echo "   curl http://localhost:3000/api/users/me -H 'Authorization: Bearer TOKEN'"
echo ""
echo "4. Abre Prisma Studio para inspeccionar la BD:"
echo "   npx prisma studio"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}¡Listo para comenzar! 🎉${NC}"
echo "════════════════════════════════════════════════════════════════"
