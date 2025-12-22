class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  
  start(operation: string) {
    this.measurements.set(operation, [performance.now()]);
  }
  
  end(operation: string) {
    const startTimes = this.measurements.get(operation);
    if (startTimes && startTimes.length > 0) {
      const duration = performance.now() - startTimes[0];
      
      // Alertar si una operación tarda demasiado
      if (duration > 100) { // 100ms
        console.warn(`⚠️ Operación lenta: ${operation} - ${duration.toFixed(2)}ms`);
        
        // Enviar a analytics en producción
        if (process.env.NODE_ENV === 'production') {
          this.sendMetric(operation, duration);
        }
      }
      
      console.log(`${operation}: ${duration.toFixed(2)}ms`);
      this.measurements.delete(operation);
    }
  }
  
  private sendMetric(operation: string, duration: number) {
    // Enviar métrica a tu servicio de monitoring
    try {
      navigator.sendBeacon('/api/metrics', JSON.stringify({ 
        operation, 
        duration, 
        timestamp: Date.now() 
      }));
    } catch (error) {
      // Fallback silencioso
    }
  }
}

export const perfMonitor = new PerformanceMonitor();