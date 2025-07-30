import React, { useEffect, useState } from "react";
import { 
  HardDrive, 
  FileText, 
  Trash2, 
  Copy, 
  TrendingUp,
  Database,
  PieChart,
  BarChart3
} from "lucide-react";

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const mockData = {
      totalUsage: 2147483648, // 2GB in bytes
      totalQuota: 16106127360, // 15GB in bytes
      totalDuplicateSize: 524288000, // 500MB
      deletedSize: 314572800, // 300MB
      typeStats: { videos: 45, images: 128, documents: 67, others: 23 },
      sizeCategories: { small: 156, medium: 78, large: 23, huge: 6 }
    };

    setTimeout(() => {
      setReportData(mockData);
      setLoading(false);
    }, 1500);
  }, []);

  const toMB = (bytes) => (bytes ? (bytes / 1024 / 1024).toFixed(1) : 0);
  const toGB = (bytes) => (bytes ? (bytes / 1024 / 1024 / 1024).toFixed(2) : 0);
  const gradientBg = {
    background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
    minHeight: '100vh',
    width: '100%'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.3s ease',
    color: 'white'
  };

  const iconStyle = (bgColor) => ({
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: bgColor,
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  if (loading) {
    return (
      <div style={gradientBg}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #8b5cf6',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: 'white', fontSize: '18px' }}>Loading your drive analytics...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{...gradientBg, background: 'linear-gradient(135deg, #0f172a 0%, #dc2626 50%, #0f172a 100%)'}}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{
            ...cardStyle,
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Error Loading Data</h2>
            <p style={{ color: '#fecaca' }}>Could not load report data.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalUsage = 0,
    totalQuota = 1,
    totalDuplicateSize = 0,
    deletedSize = 0,
    typeStats = { videos: 0, images: 0, documents: 0, others: 0 },
    sizeCategories = { small: 0, medium: 0, large: 0, huge: 0 },
  } = reportData;

  const usagePercentage = ((totalUsage / totalQuota) * 100).toFixed(1);
  const duplicatePercentage = ((totalDuplicateSize / totalUsage) * 100).toFixed(1);

  const storageData = [
    { name: 'Used', value: parseInt(toMB(totalUsage)), fill: '#8b5cf6' },
    { name: 'Free', value: parseInt(toMB(totalQuota - totalUsage)), fill: '#374151' }
  ];

  const duplicateData = [
    { name: 'Duplicates', value: parseInt(toMB(totalDuplicateSize)), fill: '#ef4444' },
    { name: 'Original', value: parseInt(toMB(totalUsage - totalDuplicateSize)), fill: '#10b981' }
  ];

  const typeData = [
    { name: 'Videos', value: typeStats.videos, fill: '#3b82f6' },
    { name: 'Images', value: typeStats.images, fill: '#10b981' },
    { name: 'Documents', value: typeStats.documents, fill: '#f97316' },
    { name: 'Others', value: typeStats.others, fill: '#8b5cf6' }
  ];

  const sizeData = [
    { name: 'Small (<5MB)', value: sizeCategories.small, fill: '#06b6d4' },
    { name: 'Medium (<50MB)', value: sizeCategories.medium, fill: '#3b82f6' },
    { name: 'Large (<200MB)', value: sizeCategories.large, fill: '#8b5cf6' },
    { name: 'Huge (≥200MB)', value: sizeCategories.huge, fill: '#ef4444' }
  ];

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, progress = 0 }) => (
    <div style={{
      ...cardStyle,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '140px'
    }} 
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      {/* Background Accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        borderRadius: '0 12px 0 60px'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              ...iconStyle(color),
              width: '40px',
              height: '40px',
              boxShadow: `0 4px 12px ${color}40`
            }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '14px', 
                fontWeight: '600', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>{title}</h3>
            </div>
          </div>
          {trend && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <TrendingUp size={14} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: 'white', 
            marginBottom: '4px',
            lineHeight: '1'
          }}>{value}</div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '13px',
            fontWeight: '500'
          }}>{subtitle}</div>
        </div>

        {/* Progress Indicator */}
        <div style={{ marginTop: '16px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(progress, 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
              borderRadius: '2px',
              transition: 'width 1s ease-out',
              boxShadow: `0 0 8px ${color}60`
            }}></div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px'
          }}>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>Progress</span>
            <span style={{
              fontSize: '11px',
              color: color,
              fontWeight: '600'
            }}>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children, icon: Icon, data = [] }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={iconStyle('#8b5cf6')}>
          <Icon size={20} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
      {/* Legend inside the chart card */}
      {data && data.length > 0 && (
        <div style={{ 
          marginTop: '24px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px'
        }}>
          {data.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: `1px solid ${item.fill}30`
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: item.fill,
                boxShadow: `0 0 6px ${item.fill}80`
              }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '12px',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  color: item.fill, 
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const CustomPieChart = ({ data, width = 300, height = 300 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = Math.min(width, height) / 2 - 30;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let cumulativeAngle = 0;

    return (
      <div style={{ position: 'relative', width, height }}>
        <svg width={width} height={height}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) : 0;
            const angle = percentage * 2 * Math.PI;
            
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            const largeArcFlag = angle > Math.PI ? 1 : 0;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            cumulativeAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.fill}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                style={{
                  transition: 'all 0.3s ease',
                  transformOrigin: `${centerX}px ${centerY}px`
                }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{total}</div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Total</div>
        </div>
      </div>
    );
  };

  const CustomBarChart = ({ data, width = 400, height = 300 }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const barWidth = (width - 80) / data.length;
    const chartHeight = height - 80;

    return (
      <div>
        <svg width={width} height={height}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
            const x = 40 + index * barWidth + barWidth * 0.1;
            const y = height - 60 - barHeight;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth * 0.8}
                  height={barHeight}
                  fill={item.fill}
                  rx="4"
                  style={{
                    transition: 'all 0.6s ease',
                    animationDelay: `${index * 200}ms`
                  }}
                />
                <text
                  x={x + barWidth * 0.4}
                  y={height - 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                >
                  {item.name.split(' ')[0]}
                </text>
                <text
                  x={x + barWidth * 0.4}
                  y={y - 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="600"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={gradientBg}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📊 Drive Analytics Dashboard
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px' }}>
            Comprehensive insights into your storage usage and file management
          </p>
        </div>

        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px', 
          marginBottom: '48px',
          maxWidth: '800px',
          margin: '0 auto 48px auto'
        }}>
          <StatCard
            icon={HardDrive}
            title="Storage Used"
            value={`${toGB(totalUsage)} GB`}
            subtitle={`${usagePercentage}% of ${toGB(totalQuota)} GB`}
            color="#8b5cf6"
            trend="+2.5%"
            progress={parseFloat(usagePercentage)}
          />
          <StatCard
            icon={Copy}
            title="Duplicates Found"
            value={`${toMB(totalDuplicateSize)} MB`}
            subtitle={`${duplicatePercentage}% of total storage`}
            color="#ef4444"
            progress={parseFloat(duplicatePercentage)}
          />
          <StatCard
            icon={Trash2}
            title="Space Recovered"
            value={`${toMB(deletedSize)} MB`}
            subtitle="From duplicate cleanup"
            color="#f59e0b"
            progress={75}
          />
          <StatCard
            icon={FileText}
            title="Total Files"
            value={Object.values(typeStats).reduce((a, b) => a + b, 0)}
            subtitle="Across all categories"
            color="#3b82f6"
            progress={85}
          />
        </div>

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '32px',
          marginBottom: '48px'
        }}>
          {/* Storage Usage */}
          <ChartCard title="Storage Breakdown" icon={PieChart} data={storageData}>
            <CustomPieChart data={storageData} />
          </ChartCard>

          {/* File Types */}
          <ChartCard title="File Type Distribution" icon={Database} data={typeData}>
            <CustomPieChart data={typeData} />
          </ChartCard>

          {/* Duplicates */}
          <ChartCard title="Duplicate Analysis" icon={Copy} data={duplicateData}>
            <CustomPieChart data={duplicateData} />
          </ChartCard>

          {/* File Sizes */}
          <ChartCard title="File Size Categories" icon={BarChart3} data={sizeData}>
            <CustomBarChart data={sizeData} />
          </ChartCard>
        </div>

        {/* Additional Insights */}
        <div style={{
          ...cardStyle,
          marginTop: '48px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <TrendingUp size={24} color="#a855f7" />
            Key Insights
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px' 
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎯</div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>Optimization Potential</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                You can free up {toMB(totalDuplicateSize)} MB by removing duplicates
              </p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>📈</div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>Storage Health</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                {usagePercentage < 80 ? 'Good' : 'Consider cleanup'} - {(100 - parseFloat(usagePercentage)).toFixed(1)}% free space remaining
              </p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔄</div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '8px' }}>Cleanup Progress</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Successfully recovered {toMB(deletedSize)} MB of storage space
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;