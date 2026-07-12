using System;
using System.Globalization;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace Morget.UI.Converters;

public sealed class StatusToColorConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var color = value?.ToString() switch
        {
            "Enabled" => "#4caf50",
            "Disabled" => "#ff9800",
            "Error" => "#f44336",
            _ => "#9e9e9e"
        };
        return new SolidColorBrush(Color.Parse(color));
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
