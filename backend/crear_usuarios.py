from api.models import CustomUser

print("🔍 Verificando usuarios existentes...")

# Eliminar usuarios existentes con estos correos si existen
usuarios_eliminar = CustomUser.objects.filter(
    correo_personal__in=['adminprueba@gmail.com', 'profesorprueba@gmail.com', 'estudianteprueba@gmail.com']
) | CustomUser.objects.filter(
    email__in=['adminprueba@thelanguage.co', 'profesorprueba@thelanguage.co', 'estudianteprueba@thelanguage.co']
)
count = usuarios_eliminar.count()
if count > 0:
    usuarios_eliminar.delete()
    print(f"🗑️  {count} usuarios existentes eliminados")

# 1. ADMIN
try:
    admin = CustomUser.objects.create_user(
        username='adminprueba@gmail.com',
        email='adminprueba@thelanguage.co',
        correo_personal='adminprueba@gmail.com',
        first_name='Admin',
        last_name='Prueba',
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    admin.set_password('Admin123')
    admin.save()
    print(f"✅ Admin creado: adminprueba@gmail.com / Admin123")
except Exception as e:
    print(f"❌ Error creando admin: {e}")

# 2. PROFESOR
try:
    profesor = CustomUser.objects.create_user(
        username='profesorprueba@gmail.com',
        email='profesorprueba@thelanguage.co',
        correo_personal='profesorprueba@gmail.com',
        first_name='Carlos',
        last_name='Martínez',
        role='profesor',
        is_profesor=True,
        is_active=True
    )
    profesor.set_password('Profesor123')
    profesor.save()
    print(f"✅ Profesor creado: profesorprueba@gmail.com / Profesor123")
except Exception as e:
    print(f"❌ Error creando profesor: {e}")

# 3. ESTUDIANTE
try:
    estudiante = CustomUser.objects.create_user(
        username='estudianteprueba@gmail.com',
        email='estudianteprueba@thelanguage.co',
        correo_personal='estudianteprueba@gmail.com',
        first_name='María',
        last_name='García',
        role='student',
        english_level='intermediate',
        is_active=True
    )
    estudiante.set_password('Estudiante123')
    estudiante.save()
    print(f"✅ Estudiante creado: estudianteprueba@gmail.com / Estudiante123")
except Exception as e:
    print(f"❌ Error creando estudiante: {e}")

print("\n" + "="*60)
print("🔐 CREDENCIALES PARA LOGIN:")
print("="*60)
print("\n1️⃣  ADMIN:")
print("   Email: adminprueba@gmail.com")
print("   Password: Admin123")
print("\n2️⃣  PROFESOR:")
print("   Email: profesorprueba@gmail.com")
print("   Password: Profesor123")
print("\n3️⃣  ESTUDIANTE:")
print("   Email: estudianteprueba@gmail.com")
print("   Password: Estudiante123")
print("\n✅ Todos los usuarios están listos para probar el login!")
print("="*60)
