import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export default function App() {
  const [history, setHistory] = useState([]);
  const [barcode, setBarcode] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [pcCount, setPcCount] = useState(0);
  const [monitorCount, setMonitorCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      // Carregar contagens salvas do armazenamento (se houver)
      const savedCounts = await loadCounts();
      if (savedCounts) {
        setPcCount(savedCounts.pcCount);
        setMonitorCount(savedCounts.monitorCount);
      }
    })();
  }, []);

  const loadCounts = async () => {
    try {
      const savedCounts = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'counts.json');
      return JSON.parse(savedCounts);
    } catch (error) {
      console.error('Erro ao carregar contagens:', error);
      return null;
    }
  };

  const saveCounts = async () => {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'counts.json',
        JSON.stringify({ pcCount, monitorCount })
      );
    } catch (error) {
      console.error('Erro ao salvar contagens:', error);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setBarcode(data);
    Alert.alert('Código de barras escaneado', `Código: ${data}`);

    if (selectedType === 'PC') {
      setPcCount(pcCount + 1);
    } else if (selectedType === 'Monitor') {
      setMonitorCount(monitorCount + 1);
    }

    setHistory([...history, { barcode: data, type: selectedType }]);
  };

  const clearHistory = () => {
    setHistory([]);
    setPcCount(0);
    setMonitorCount(0);
  };

  const copyToClipboard = () => {
    let listText = 'Relatório de Patrimônios\n';
    history.forEach((item, index) => {
      listText += `${index + 1}: ${item.type} - ${item.barcode}\n`;
    });

    Clipboard.setString(listText);
    Alert.alert('Lista copiada', 'A lista foi copiada para a área de transferência.');
  };

  useEffect(() => {
    const saveCountsToStorage = async () => {
      await saveCounts();
    };

    saveCountsToStorage();
  }, [pcCount, monitorCount]);

  if (hasPermission === null) {
    return <Text>Solicitando permissão para acessar a câmera</Text>;
  }
  if (hasPermission === false) {
    return <Text>Sem acesso à câmera</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contador de Patrimônios</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, selectedType === 'PC' && styles.radioButtonSelected]}
          onPress={() => setSelectedType('PC')}
        >
          <Text style={styles.radioButtonText}>PC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, selectedType === 'Monitor' && styles.radioButtonSelected]}
          onPress={() => setSelectedType('Monitor')}
        >
          <Text style={styles.radioButtonText}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, selectedType === 'Estabilizador' && styles.radioButtonSelected]}
          onPress={() => setSelectedType('Estabilizador')}
        >
          <Text style={styles.radioButtonText}>Estabilizador</Text>
        </TouchableOpacity>
      </View>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.barcodeScanner}
      />
      {scanned && (
        <Button title="Toque para escanear novamente" onPress={() => setScanned(false)} />
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={copyToClipboard}
      >
        <Text style={styles.buttonText}>Copiar Lista</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={clearHistory}
      >
        <Text style={styles.buttonText}>Limpar Histórico</Text>
      </TouchableOpacity>
      <Text style={styles.counter}>PCs: {pcCount}</Text>
      <Text style={styles.counter}>Monitores: {monitorCount}</Text>
      <Text style={styles.counter}>Estabilizadores: {monitorCount}</Text>
      <FlatList
        data={history}
        renderItem={({ item, index }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>{index + 1}: {item.type} - {item.barcode}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={styles.historyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 70,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
  },
  radioButtonSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  radioButtonText: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
  barcodeScanner: {
    height: 200,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  counter: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyList: {
    width: '100%',
  },
  historyItem: {
    backgroundColor: '#DDD',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  historyText: {
    fontSize: 18,
  },
});










// import React, { useState } from 'react';
// import { StyleSheet, Text, View, Button, FlatList, TextInput } from 'react-native';

// export default function App() {
//   const [count, setCount] = useState(0);
//   const [history, setHistory] = useState([]);
//   const [patrimonyName, setPatrimonyName] = useState('');

//   const incrementCount = () => {
//     setCount(count + 1);
//   };

//   const clearCount = () => {
//     if (patrimonyName.trim() !== '') {
//       setHistory([...history, { name: patrimonyName, count }]);
//     } else {
//       setHistory([...history, { name: 'Patrimônio sem nome', count }]);
//     }
//     setCount(0);
//     setPatrimonyName('');
//   };

//   const renderItem = ({ item, index }) => (
//     <View style={styles.historyItem}>
//       <Text style={styles.historyText}>Contagem {index + 1}: {item.name} - {item.count}</Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Contador de Patrimônios</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Nome do Patrimônio"
//         value={patrimonyName}
//         onChangeText={setPatrimonyName}
//       />
//       <Text style={styles.counter}>{count}</Text>
//       <View style={styles.buttonContainer}>
//         <View style={styles.button}>
//           <Button title="Adicionar Patrimônio" onPress={incrementCount} />
//         </View>
//         <View style={styles.button}>
//           <Button title="Limpar Contador" onPress={clearCount} />
//         </View>
//       </View>
//       <FlatList
//         data={history}
//         renderItem={renderItem}
//         keyExtractor={(item, index) => index.toString()}
//         style={styles.historyList}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   title: {
//     fontSize: 24,
//     marginBottom: 100,
//     top: 40
//   },
//   input: {
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 20,
//     paddingHorizontal: 10,
//     width: '80%',
//   },
//   counter: {
//     fontSize: 48,
//     marginBottom: 20,
//   },
//   buttonContainer: {
//     alignItems: 'center',
//     width: '80%',
//     marginBottom: 20,
//   },
//   button: {
//     width: '100%',
//     marginBottom: 10,
//   },
//   historyList: {
//     width: '80%',
//   },
//   historyItem: {
//     backgroundColor: '#DDD',
//     padding: 10,
//     marginVertical: 5,
//     borderRadius: 5,
//   },
//   historyText: {
//     fontSize: 18,
//   },
// });
