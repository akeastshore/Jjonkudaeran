// 재료 설명 사이드바 컴포넌트
import { INGREDIENT_LEGEND } from '../../constants/gameConstants';

const IngredientLegend = () => {
  return (
    <div style={{ 
      background: '#333', 
      padding: '20px', 
      borderRadius: '10px', 
      color: 'white', 
      minWidth: '200px' 
    }}>
      <h3 style={{ 
        borderBottom: '1px solid #555', 
        paddingBottom: '10px', 
        marginTop: 0 
      }}>
        재료 설명
      </h3>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'separate', 
        borderSpacing: '0 5px' 
      }}>
        <tbody>
          {INGREDIENT_LEGEND.map((item, idx) => (
            <tr key={idx}>
              <td style={{ width: '20px' }}>
                <div style={{ 
                  width: '15px', 
                  height: '15px', 
                  borderRadius: '50%', 
                  backgroundColor: item.color, 
                  border: '1px solid #fff' 
                }} />
              </td>
              <td style={{ textAlign: 'left', fontSize: '0.8rem' }}>
                {item.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IngredientLegend;
