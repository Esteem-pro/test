import streamlit as st
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import warnings

warnings.filterwarnings('ignore')
plt.style.use('default')

# Настройка страницы
st.set_page_config(page_title="Прогноз лидов", layout="wide")
st.title("📊 Анализ и прогноз стоимости квалифицированного лида")

# Боковая панель с настройками
st.sidebar.header("⚙️ Настройки анализа")
new_budget = st.sidebar.number_input("Бюджет на следующий период (₽)", min_value=1000, value=950000, step=10000)
weeks_in_forecast = st.sidebar.number_input("Количество недель в прогнозе", min_value=1, value=1)
analysis_weeks = st.sidebar.number_input("Анализировать последние (недель)", min_value=4, value=114)

st.write("Загрузите ваш файл с историей расходов и лидов, чтобы построить прогноз.")

# Загрузка файла
uploaded_file = st.file_uploader("Выберите файл (CSV или Excel)", type=['csv', 'xlsx', 'xls'])

if uploaded_file is not None:
    try:
        # Чтение файла
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file, sep=None, engine='python')
        else:
            df = pd.read_excel(uploaded_file)
            
        st.success(f"✅ Файл успешно загружен! Строк: {len(df)}")
        
        # Проверка столбцов
        required_columns = ['date', 'spend', 'leads']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            st.error(f"❌ ОШИБКА: Отсутствуют столбцы: {missing_columns}")
            st.stop()
            
        if 'qualified_leads' not in df.columns and 'qualification_rate' not in df.columns:
            st.error("❌ ОШИБКА: Нужен столбец 'qualified_leads' ИЛИ 'qualification_rate'")
            st.stop()
            
        # Подготовка данных
        df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
        df = df.dropna(subset=['date']).sort_values('date')
        
        if 'qualified_leads' not in df.columns:
            df['qualified_leads'] = df['leads'] * df['qualification_rate']
            
        df['cpl'] = df['spend'] / df['leads']
        df['cpql'] = df['spend'] / df['qualified_leads']
        df['qualification_rate'] = df['qualified_leads'] / df['leads']
        
        df_analysis = df.tail(analysis_weeks).copy()
        
        # Расчет эластичности
        valid_data = df_analysis[(df_analysis['spend'] > 0) & (df_analysis['qualified_leads'] > 0)].copy()
        
        if len(valid_data) >= 3:
            log_spend = np.log(valid_data['spend'])
            log_qualified = np.log(valid_data['qualified_leads'])
            slope, intercept, r_value, p_value, std_err = stats.linregress(log_spend, log_qualified)
            beta = max(0.5, min(1.0, slope))
        else:
            beta = 1.0
            r_value = 0
            
        # Нормализация
        reference_spend = df_analysis['spend'].median()
        df_analysis['cpql_normalized'] = df_analysis['cpql'] / ((df_analysis['spend'] / reference_spend) ** (1 - beta))
        
        cpql_opt_base = np.percentile(df_analysis['cpql_normalized'], 25)
        cpql_neutral_base = np.percentile(df_analysis['cpql_normalized'], 50)
        cpql_pess_base = np.percentile(df_analysis['cpql_normalized'], 75)
        
        # Прогноз
        new_budget_total = new_budget * weeks_in_forecast
        budget_factor = (new_budget_total / reference_spend) ** (1 - beta)
        
        cpql_opt = cpql_opt_base * budget_factor
        cpql_neutral = cpql_neutral_base * budget_factor
        cpql_pess = cpql_pess_base * budget_factor
        
        leads_opt = new_budget_total / cpql_opt
        leads_neutral = new_budget_total / cpql_neutral
        leads_pess = new_budget_total / cpql_pess
        
        avg_qual_rate = df_analysis['qualification_rate'].mean()
        
        total_leads_opt = leads_opt / avg_qual_rate
        total_leads_neutral = leads_neutral / avg_qual_rate
        total_leads_pess = leads_pess / avg_qual_rate
        
        cpl_opt = new_budget_total / total_leads_opt
        cpl_neutral = new_budget_total / total_leads_neutral
        cpl_pess = new_budget_total / total_leads_pess
        
        # ВЫВОД РЕЗУЛЬТАТОВ
        st.markdown("---")
        st.header(f"Итоговый прогноз (Бюджет: {new_budget_total:,.0f} ₽)")
        
        # Красивые карточки (Метрики)
        col1, col2, col3 = st.columns(3)
        col1.metric("Оптимистичный CPQL", f"{cpql_opt:,.0f} ₽")
        col2.metric("Нейтральный CPQL", f"{cpql_neutral:,.0f} ₽")
        col3.metric("Пессимистичный CPQL", f"{cpql_pess:,.0f} ₽")
        
        # Таблица прогноза
        forecast_table = pd.DataFrame({
            'Сценарий': ['Оптимистичный', 'Нейтральный', 'Пессимистичный'],
            'Прогнозный CPL': [f"{cpl_opt:,.0f} ₽", f"{cpl_neutral:,.0f} ₽", f"{cpl_pess:,.0f} ₽"],
            '% квалификации': [f"{avg_qual_rate*100:.1f}%", f"{avg_qual_rate*100:.1f}%", f"{avg_qual_rate*100:.1f}%"],
            'Прогноз лидов': [f"{total_leads_opt:.0f}", f"{total_leads_neutral:.0f}", f"{total_leads_pess:.0f}"],
            'Прогноз квал. лидов': [f"{leads_opt:.0f}", f"{leads_neutral:.0f}", f"{leads_pess:.0f}"]
        })
        st.table(forecast_table.set_index('Сценарий'))
        
        # ВИЗУАЛИЗАЦИЯ
        st.markdown("---")
        st.header("Графики")
        
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # 1. Динамика
        axes[0, 0].plot(df['date'], df['cpql'], marker='o', linewidth=1.5, markersize=4, label='CPQL (факт)')
        axes[0, 0].axhline(y=cpql_neutral_base, color='g', linestyle='--', label=f'Нейтральный базовый ({cpql_neutral_base:,.0f} ₽)')
        axes[0, 0].fill_between(df['date'], cpql_opt_base, cpql_pess_base, alpha=0.2, color='blue')
        axes[0, 0].set_title('Историческая динамика CPQL')
        axes[0, 0].tick_params(axis='x', rotation=45)
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)

        # 2. Зависимость
        axes[0, 1].scatter(df_analysis['spend'], df_analysis['qualified_leads'], s=80, alpha=0.6)
        axes[0, 1].set_xlabel('Расход (₽)')
        axes[0, 1].set_ylabel('Квалифицированные лиды')
        axes[0, 1].set_title(f'Зависимость квал. лидов от расхода (β = {beta:.2f})')
        axes[0, 1].grid(True, alpha=0.3)

        # 3 и 4. Столбчатые диаграммы
        scenarios = ['Оптимистичный', 'Нейтральный', 'Пессимистичный']
        colors = ['green', 'blue', 'red']
        
        bars1 = axes[1, 0].bar(scenarios, [cpql_opt, cpql_neutral, cpql_pess], color=colors, alpha=0.7)
        axes[1, 0].set_title('Прогнозный CPQL (₽)')
        for bar in bars1:
            axes[1, 0].text(bar.get_x() + bar.get_width()/2., bar.get_height(), f'{bar.get_height():,.0f}', ha='center', va='bottom')

        bars2 = axes[1, 1].bar(scenarios, [leads_opt, leads_neutral, leads_pess], color=colors, alpha=0.7)
        axes[1, 1].set_title('Прогноз квал. лидов')
        for bar in bars2:
            axes[1, 1].text(bar.get_x() + bar.get_width()/2., bar.get_height(), f'{bar.get_height():.0f}', ha='center', va='bottom')

        plt.tight_layout()
        st.pyplot(fig)
        
    except Exception as e:
        st.error(f"Произошла ошибка при обработке данных: {str(e)}")
