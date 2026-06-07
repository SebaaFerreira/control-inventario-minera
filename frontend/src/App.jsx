import { useState, useEffect } from 'react'

function App() {
  // Aquí guardaremos los artículos que lleguen desde Django
  const [articulos, setArticulos] = useState([])

  // useEffect hace que la llamada a la API ocurra justo cuando la página carga
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(response => response.json())
      .then(data => {
        console.log("Datos recibidos de Django:", data)
        setArticulos(data)
      })
      .catch(error => console.error("Error al conectar con la API:", error))
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Panel de Bodega - Promet Servicios</h1>
      <h2>Listado de Artículos en Pañol</h2>
      
      {/* Si el arreglo está vacío, mostramos un mensaje */}
      {articulos.length === 0 ? (
        <p>Buscando artículos en la base de datos...</p>
      ) : (
        // Si hay datos, dibujamos una lista
        <ul style={{ fontSize: '18px', lineHeight: '1.8' }}>
          {articulos.map(articulo => (
            <li key={articulo.id}>
              <strong>{articulo.codigo_interno} | {articulo.nombre}</strong> 
              <br />
              Stock Actual: {articulo.stock_actual} {articulo.unidad_medida}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App