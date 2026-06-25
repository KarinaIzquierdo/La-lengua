#!/usr/bin/env python
"""
Script para migrar datos de SQLite a MySQL
Ejecutar ANTES de cambiar settings.py a MySQL
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🚀 Iniciando migración de SQLite a MySQL\n")
    
    BASE_DIR = Path(__file__).resolve().parent
    sqlite_db = BASE_DIR / 'db.sqlite3'
    backup_file = BASE_DIR / 'data_backup.json'
    
    # Verificar que existe db.sqlite3
    if not sqlite_db.exists():
        print("❌ No se encontró db.sqlite3")
        print("   La base de datos SQLite no existe.")
        return
    
    print("📦 Paso 1: Exportando datos de SQLite...")
    print("   Asegúrate de que settings.py esté configurado para SQLite temporalmente.\n")
    
    # Instrucciones para el usuario
    print("=" * 60)
    print("INSTRUCCIONES:")
    print("=" * 60)
    print("\n1️⃣  Ejecuta este comando para exportar los datos:")
    print("     python3 manage.py dumpdata --natural-foreign --natural-primary \\")
    print("       --exclude=contenttypes --exclude=auth.permission \\")
    print("       --indent=2 > data_backup.json")
    print("\n2️⃣  Verifica que se creó el archivo data_backup.json")
    print("\n3️⃣  Luego ejecuta:")
    print("     python3 manage.py loaddata data_backup.json")
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
