import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, ChevronLeft, ChevronRight, DollarSign, TrendingUp, ShoppingBag, Download } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate, pdfFormatPrice } from '../../utils/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const OutletSales = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ period: 'all', minAmount: '', maxAmount: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalSales: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalSales: 0, averageSale: 0, saleCount: 0 });
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportPeriod, setReportPeriod] = useState('all');
  const [reportDates, setReportDates] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  });
  const [showReportOptions, setShowReportOptions] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters - removed outletId as it's causing filtering issues
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        
        if (searchInput) queryParams.append('search', searchInput);
        if (filters.period !== 'all') queryParams.append('period', filters.period);
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
        
        // Set headers with authentication token
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };
        
        // Make API call to fetch sales data
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/sales?${queryParams.toString()}`, { headers });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error(data.message || 'Failed to fetch sales data');
        }
        
        const sortedSales = [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        setSales(sortedSales);
        setSummary(data.summary);
        setPagination(prev => ({
          ...prev,
          totalSales: data.totalSales,
          totalPages: data.totalPages
        }));
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchSales();
    } else {
      setError('No outlet found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchInput, filters, currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  // Function to fetch sales data for the report
  const fetchSalesDataForReport = async () => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '0'); // Fetch all sales without pagination
      
      if (reportPeriod !== 'all') {
        queryParams.append('period', reportPeriod);
      }
      
      // Add date range if custom period is selected
      if (reportPeriod === 'custom') {
        if (!reportDates.startDate || !reportDates.endDate) {
          throw new Error('Please select both start and end dates for custom range');
        }
        queryParams.append('startDate', reportDates.startDate);
        queryParams.append('endDate', reportDates.endDate);
      }
      
      // Set headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
      };
      
      // Get outlet ID from current user
      const outletId = currentUser?.outletId || currentUser?._id;
      
      if (!outletId) {
        throw new Error('Outlet ID not found. Please ensure you are logged in as an outlet user.');
      }
      
      try {
        // Make API call to fetch sales data
        const response = await fetch(`https://breakfast-factory-jumia.onrender.com/api/route/sales?${queryParams.toString()}`, { 
          headers,
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (apiError) {
        console.warn('API fetch failed, using current sales data:', apiError);
        
        // Fallback: Use the current sales data from state
        return {
          sales: sales.map(sale => ({
            ...sale,
            items: sale.products?.length || 0,
            date: sale.date || new Date().toISOString()
          })),
          summary: {
            totalSales: summary.totalSales || 0,
            averageSale: summary.averageSale || 0,
            saleCount: summary.saleCount || 0
          }
        };
      }
    } catch (error) {
      console.error('Error in fetchSalesDataForReport:', error);
      
      // Final fallback: Return empty data structure
      return {
        sales: [],
        summary: {
          totalSales: 0,
          averageSale: 0,
          saleCount: 0
        }
      };
    }
  };

  // Function to generate PDF report
// Enhanced PDF generation function with better styling and extended table
// Enhanced PDF generation function with better styling and extended table
const generatePDFReport = async (data) => {
  try {
    console.log('Attempting enhanced PDF generation');
    
    // Create a new PDF document
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Define simplified color palette
    const colors = {
      primary: [255, 107, 61],      // #FF6B3D - Orange
      dark: [31, 41, 55],           // #1F2937 - Dark Gray
      medium: [107, 114, 128],      // #6B7280 - Medium Gray
      light: [243, 244, 246],       // #F3F4F6 - Light Gray
      white: [255, 255, 255],       // #FFFFFF - White
      green: [34, 197, 94],         // #22C55E - Green (for delivered status)
      yellow: [251, 191, 36],       // #FBBF24 - Yellow (for pending status)
      red: [239, 68, 68],           // #EF4444 - Red (for cancelled status)
    };
    
    // Get outlet name and format date range
    const outletName = 'Onyame Adepa';
    let dateRangeText = '';
    if (reportPeriod === 'custom') {
      dateRangeText = `${reportDates.startDate} to ${reportDates.endDate}`;
    } else if (reportPeriod === 'daily') {
      dateRangeText = 'Today';
    } else if (reportPeriod === 'weekly') {
      dateRangeText = 'Last 7 days';
    } else if (reportPeriod === 'monthly') {
      dateRangeText = 'Last 30 days';
    } else if (reportPeriod === 'yearly') {
      dateRangeText = 'Last 12 months';
    } else {
      dateRangeText = 'All Time';
    }
    
    // Add header with simple styling
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pdfWidth, 80, 'F');
    
    // Company name in white on colored background
    pdf.setFontSize(28);
    pdf.setTextColor(...colors.white);
    pdf.setFont('helvetica', 'bold');
    pdf.text(outletName, 40, 35);
    
    // Report title
    pdf.setFontSize(18);
    pdf.setTextColor(...colors.white);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sales Report', 40, 60);
    
    // Reset text color and add report details
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Period: ${dateRangeText}`, 40, 110);
    pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 40, 130);
    
    // Summary section with simple cards
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.dark);
    pdf.text('Summary Overview', 40, 170);
    
    const cardWidth = 200;
    const cardHeight = 80;
    const cardSpacing = 40;
    const startX = 80;
    const startY = 190;
    
    // Total Sales Card
    pdf.setFillColor(...colors.light);
    pdf.setDrawColor(...colors.medium);
    pdf.setLineWidth(1);
    pdf.roundedRect(startX, startY, cardWidth, cardHeight, 8, 8, 'FD');
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL SALES', startX + 15, startY + 25);
    pdf.setFontSize(24);
    pdf.text(pdfFormatPrice(data.summary.totalSales), startX + 15, startY + 55);
    
    // Sale Count Card
    pdf.setFillColor(...colors.light);
    pdf.roundedRect(startX + cardWidth + cardSpacing, startY, cardWidth, cardHeight, 8, 8, 'FD');
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SALE COUNT', startX + cardWidth + cardSpacing + 15, startY + 25);
    pdf.setFontSize(24);
    pdf.text(data.summary.saleCount.toString(), startX + cardWidth + cardSpacing + 15, startY + 55);
    
    // Sales Details Table
    const tableStartY = 300;
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sales Details', 40, tableStartY - 10);
    
    // Table dimensions
    const tableWidth = pdfWidth - 80;
    const colWidths = [150, 150, 100, 120]; // Date, Amount, Items, Status
    const rowHeight = 35;
    const headerHeight = 40;
    
    // Table header background
    pdf.setFillColor(...colors.dark);
    pdf.rect(40, tableStartY, tableWidth, headerHeight, 'F');
    
    // Table headers
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    
    let currentX = 50;
    const headers = ['Date', 'Amount', 'Items', 'Status'];
    headers.forEach((header, index) => {
      pdf.text(header, currentX, tableStartY + 25);
      currentX += colWidths[index];
    });
    
    // Table rows with alternating colors
    let currentY = tableStartY + headerHeight;
    const maxRowsPerPage = Math.floor((pdfHeight - currentY - 80) / rowHeight);
    
    // Show more sales (up to 50 instead of 20)
    const salesToShow = Math.min(data.sales.length, 50);
    
    data.sales.slice(0, salesToShow).forEach((sale, index) => {
      // Check if we need a new page
      if (index > 0 && index % maxRowsPerPage === 0) {
        pdf.addPage();
        currentY = 40;
        
        // Add page header
        pdf.setFillColor(...colors.light);
        pdf.rect(0, 0, pdfWidth, 40, 'F');
        pdf.setTextColor(...colors.dark);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${outletName} - Sales Report (Continued)`, 40, 25);
        
        // Recreate table header
        pdf.setFillColor(...colors.dark);
        pdf.rect(40, currentY, tableWidth, headerHeight, 'F');
        
        pdf.setTextColor(...colors.white);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        
        let headerX = 50;
        headers.forEach((header, headerIndex) => {
          pdf.text(header, headerX, currentY + 25);
          headerX += colWidths[headerIndex];
        });
        
        currentY += headerHeight;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(...colors.light);
        pdf.rect(40, currentY, tableWidth, rowHeight, 'F');
      } else {
        pdf.setFillColor(...colors.white);
        pdf.rect(40, currentY, tableWidth, rowHeight, 'F');
      }
      
      // Add subtle border
      pdf.setDrawColor(...colors.medium);
      pdf.setLineWidth(0.5);
      pdf.rect(40, currentY, tableWidth, rowHeight, 'S');
      
      // Row data
      pdf.setTextColor(...colors.dark);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      let rowX = 50;
      const rowData = [
        formatDate(sale.date),
        pdfFormatPrice(sale.amount),
        sale.items.toString(),
        sale.status
      ];
      
      rowData.forEach((data, dataIndex) => {
        // Special styling for status column
        if (dataIndex === 3) {
          let statusColor;
          switch (sale.status.toLowerCase()) {
            case 'delivered':
            case 'completed':
              statusColor = colors.green;
              break;
            case 'pending':
              statusColor = colors.yellow;
              break;
            case 'cancelled':
              statusColor = colors.red;
              break;
            default:
              statusColor = colors.medium;
          }
          
          // Status badge background
          const badgeWidth = 80;
          const badgeHeight = 20;
          const badgeX = rowX;
          const badgeY = currentY + 8;
          
          pdf.setFillColor(...statusColor);
          pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
          
          // Status text
          pdf.setTextColor(...colors.white);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(data.toUpperCase(), badgeX + 8, badgeY + 14);
          
          // Reset text color
          pdf.setTextColor(...colors.dark);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
        } else {
          // Truncate long text to fit column
          const maxLength = dataIndex === 0 ? 15 : 12;
          const displayText = data.length > maxLength ? data.substring(0, maxLength) + '...' : data;
          pdf.text(displayText, rowX, currentY + 22);
        }
        
        rowX += colWidths[dataIndex];
      });
      
      currentY += rowHeight;
    });
    
    // Add footer with summary
    const footerY = currentY + 30;
    
    if (footerY < pdfHeight - 100) {
      // Summary footer
      pdf.setFillColor(...colors.light);
      pdf.setDrawColor(...colors.medium);
      pdf.setLineWidth(1);
      pdf.rect(40, footerY, tableWidth, 60, 'FD');
      
      pdf.setTextColor(...colors.dark);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Summary', 50, footerY + 20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Showing ${salesToShow} of ${data.sales.length} total sales`, 50, footerY + 40);
      
      if (data.sales.length > salesToShow) {
        pdf.text(`${data.sales.length - salesToShow} additional sales not shown`, 50, footerY + 55);
      }
      
      // Add generation timestamp
      pdf.setTextColor(...colors.medium);
      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 50, pdfHeight - 30);
    }
    
    // Save the PDF
    const fileName = `${outletName.replace(/\s+/g, '-').toLowerCase()}-sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log('Enhanced PDF generated successfully');
    return true;
    
  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
    throw error;
  }
};

  // Function to handle CSV generation
  const generateCSV = (data) => {
    try {
      // CSV header
      let csvContent = 'Date,Amount,Items,Status\n';
      
      // Add data rows
      data.sales.forEach(sale => {
        const row = [
          formatDate(sale.date),
          sale.amount,
          sale.items,
          sale.status
        ].join(',');
        csvContent += row + '\n';
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'sales-report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  };

  // Function to handle Excel-like CSV generation
  const generateExcel = (data) => {
    try {
      // CSV header with Excel separator
      let csvContent = 'Date,Amount,Items,Status\n';
      
      // Add data rows
      data.sales.forEach(sale => {
        const row = [
          formatDate(sale.date),
          sale.amount,
          sale.items,
          sale.status
        ].join(',');
        csvContent += row + '\n';
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'sales-report.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      toast('Preparing your report...');
      
      // Validate date range for custom period
      if (reportPeriod === 'custom') {
        if (!reportDates.startDate || !reportDates.endDate) {
          toast.error('Please select both start and end dates for custom range');
          setIsLoading(false);
          return;
        }
        const start = new Date(reportDates.startDate);
        const end = new Date(reportDates.endDate);
        const now = new Date();
        if (start > end) {
          toast.error('Start date must be before end date');
          setIsLoading(false);
          return;
        }
        if (end > now) {
          toast.error('End date cannot be in the future');
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch sales data for the report
      console.log('Fetching sales data for report...');
      let salesData;
      try {
        salesData = await fetchSalesDataForReport();
        console.log('Sales data fetched successfully');
      } catch (fetchError) {
        console.error('Error fetching sales data:', fetchError);
        toast.error('Failed to fetch sales data. Using cached data if available.');
        // Try to use current sales data as fallback
        salesData = { sales: sales, summary: salesSummary };
      }
      
      // Check if we have sales data
      if (!salesData || !salesData.sales || salesData.sales.length === 0) {
        toast.warning('No sales data available for the selected period');
        setIsLoading(false);
        return;
      }
      
      console.log('Processing sales data:', {
        salesCount: salesData.sales.length,
        summary: salesData.summary
      });
      
      // Generate report based on selected format
      let success = false;
      
      try {
        toast(`Generating ${reportFormat.toUpperCase()} report...`);
        console.log(`Generating ${reportFormat} report...`);
        
        if (reportFormat === 'pdf') {
          success = await generatePDFReport(salesData);
        } else if (reportFormat === 'csv') {
          success = generateCSV(salesData);
        } else if (reportFormat === 'excel') {
          success = generateExcel(salesData);
        }
        
        if (success) {
          toast.success(`${reportFormat.toUpperCase()} report downloaded successfully`);
        } else {
          toast.warning(`Report may have been generated but not downloaded properly. Check your downloads folder.`);
        }
      } catch (reportError) {
        console.error('Error generating report:', reportError);
        
        // Provide more specific error messages based on the error type
        if (reportError.message?.includes('Unable to find element in cloned iframe')) {
          console.log('Detected iframe error - this is a known issue with html2canvas');
          toast.error(`PDF generation encountered an issue with complex styling. Try using CSV or Excel format instead.`);
        } else if (reportError.message?.includes('NetworkError')) {
          toast.error(`Network error while generating report. Please check your connection and try again.`);
        } else if (reportError.message?.includes('Out of memory')) {
          toast.error(`Browser ran out of memory. Try generating a report with fewer sales or use CSV format.`);
        } else {
          toast.error(`Error generating ${reportFormat.toUpperCase()} report: ${reportError.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error in report generation process:', err);
      toast.error(err.message || 'Failed to process report request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales</h1>
        <Button 
          onClick={() => setShowReportOptions(!showReportOptions)} 
          className="flex items-center gap-2">
          <Download size={16} />
          Download Report
        </Button>
      </div>
      
      {showReportOptions && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Download Sales Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select 
                value={reportFormat} 
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full p-2 border rounded">
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select 
                value={reportPeriod} 
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full p-2 border rounded">
                <option value="all">All Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {reportPeriod === 'custom' && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={reportDates.startDate} 
                    max={reportDates.endDate}
                    onChange={(e) => setReportDates(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={reportDates.endDate} 
                    min={reportDates.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReportDates(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleDownloadReport}
            className="w-full md:w-auto">
            Download Report
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Average Sale</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.averageSale)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Sale Count</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.saleCount}</p>
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search sales..."
            className="flex-1 p-2 border rounded"
          />
          <Button type="submit"><Search size={20} /></Button>
          <Button type="button" onClick={() => setShowFilters(!showFilters)}><Filter size={20} /></Button>
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <select name="period" value={filters.period} onChange={handleFilterChange} className="p-2 border rounded">
              <option value="all">All Periods</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="Min Amount" className="p-2 border rounded" />
            <input name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Max Amount" className="p-2 border rounded" />
          </div>
        )}
      </form>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(sale.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${
                      sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{sale.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View - Two Column Grid */}
        <div className="sm:hidden p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {formatPrice(sale.amount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {sale.items}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge className={`text-xs ${
                      sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft /></Button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <Button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}><ChevronRight /></Button>
      </div>
    </div>
  );
};

export default OutletSales;