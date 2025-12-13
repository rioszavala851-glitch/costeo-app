/**
 * Script de Migración: Sincronizar campos de usuarios y recetas
 * 
 * Este script:
 * 1. Asigna createdBy a recetas que no lo tienen
 * 2. Migra el campo 'plan' a 'planType' en usuarios
 * 3. Sincroniza currentRecipeCount para todos los usuarios
 * 
 * Ejecutar con: cd server && node scripts/migrateRecipes.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const User = require('../models/User');

async function migrateRecipes() {
    console.log('🔄 Iniciando migración completa...\n');

    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB\n');

        // ========== PASO 1: Migrar plan -> planType ==========
        console.log('📋 PASO 1: Verificando campo planType en usuarios...');

        // Buscar usuarios que tienen 'plan' pero no 'planType'
        const usersNeedingMigration = await User.find({
            $or: [
                { planType: { $exists: false } },
                { planType: null }
            ]
        });

        if (usersNeedingMigration.length > 0) {
            console.log(`   ⚠️  ${usersNeedingMigration.length} usuarios necesitan migración de plan`);

            for (const user of usersNeedingMigration) {
                const currentPlan = user.plan || 'free';
                await User.findByIdAndUpdate(user._id, {
                    planType: currentPlan,
                    currentRecipeCount: user.currentRecipeCount || 0
                });
                console.log(`   ✅ ${user.name}: planType = ${currentPlan}`);
            }
        } else {
            console.log('   ✅ Todos los usuarios ya tienen planType');
        }

        // ========== PASO 2: Migrar recetas sin createdBy ==========
        console.log('\n📋 PASO 2: Verificando recetas sin dueño...');

        const recipesWithoutOwner = await Recipe.countDocuments({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });

        if (recipesWithoutOwner === 0) {
            console.log('   ✅ Todas las recetas ya tienen dueño asignado');
        } else {
            console.log(`   ⚠️  ${recipesWithoutOwner} recetas sin dueño encontradas`);

            // Buscar al primer admin
            const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

            if (!admin) {
                console.error('   ❌ ERROR: No se encontró ningún usuario admin.');
                return;
            }

            console.log(`   👤 Asignando a admin: ${admin.name}`);

            // Listar recetas
            const recipesToMigrate = await Recipe.find({
                $or: [
                    { createdBy: { $exists: false } },
                    { createdBy: null }
                ]
            }).select('name');

            recipesToMigrate.forEach((r, i) => {
                console.log(`      ${i + 1}. ${r.name}`);
            });

            // Actualizar
            const updateResult = await Recipe.updateMany(
                {
                    $or: [
                        { createdBy: { $exists: false } },
                        { createdBy: null }
                    ]
                },
                { $set: { createdBy: admin._id } }
            );

            console.log(`   ✅ ${updateResult.modifiedCount} recetas asignadas a ${admin.name}`);
        }

        // ========== PASO 3: Sincronizar currentRecipeCount ==========
        console.log('\n📋 PASO 3: Sincronizando conteo de recetas...');

        const allUsers = await User.find();

        for (const user of allUsers) {
            const recipeCount = await Recipe.countDocuments({ createdBy: user._id });

            if (user.currentRecipeCount !== recipeCount) {
                await User.findByIdAndUpdate(user._id, { currentRecipeCount: recipeCount });
                console.log(`   🔄 ${user.name}: ${user.currentRecipeCount || 0} → ${recipeCount} recetas`);
            } else {
                console.log(`   ✅ ${user.name}: ${recipeCount} recetas (sin cambios)`);
            }
        }

        // ========== RESUMEN ==========
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(50));

        const finalUsers = await User.find().select('name email planType currentRecipeCount role');
        const finalRecipes = await Recipe.countDocuments();

        console.log(`\n👥 Usuarios (${finalUsers.length}):`);
        finalUsers.forEach(u => {
            console.log(`   • ${u.name} (${u.role})`);
            console.log(`     Email: ${u.email}`);
            console.log(`     Plan: ${u.planType}`);
            console.log(`     Recetas: ${u.currentRecipeCount}`);
        });

        console.log(`\n📝 Total recetas en sistema: ${finalRecipes}`);
        console.log('\n✅ Migración completada exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada.');
    }
}

// Ejecutar migración
migrateRecipes();
