#gpt4 
Physically Based Rendering (PBR) is a set of shading and rendering techniques in computer graphics that aim to simulate the way light interacts with surfaces in a realistic manner. The core idea behind PBR is to model the flow of light in an environment in a way that is consistent with the physical laws of light behavior. This approach provides a more uniform and predictable way to render graphics, which can closely mimic real-world materials and lighting conditions.

### Key Principles of PBR:

1. **Energy Conservation**: Materials can't reflect more light than they receive. This principle ensures that the shading model accurately represents how materials absorb and reflect light, preventing materials from appearing unnaturally bright.

2. **Microfacet Theory**: Surfaces are considered to be made up of many tiny facets (microfacets), each reflecting light. The distribution and orientation of these microfacets determine the roughness and reflectivity of the surface.

3. **Fresnel Effect**: The reflectivity of surfaces changes based on the viewing angle. Surfaces are more reflective at glancing angles, a phenomenon well captured by PBR.

4. **Metals and Non-Metals**: PBR often distinguishes between metal and non-metal (dielectric) materials, as they reflect light differently. Metals reflect more light at the surface and have a minimal diffuse reflection, while non-metals reflect less light and have more diffuse reflection.

### Components of PBR:

- **Albedo/Diffuse**: This represents the base color of the material, excluding any lighting or shadow effects.

- **Roughness**: This defines how rough or smooth a surface is, affecting how sharp or blurred reflections appear.

- **Metallic**: This indicates whether a material is a metal or non-metal, affecting how it reflects light.

- **Normal Map**: Used to simulate additional surface detail and texture without increasing the geometric complexity of the model.

- **Ambient Occlusion**: Represents how exposed each point in a scene is to ambient lighting, affecting the overall darkness and depth of creases and corners.

- **Emissive**: This property is for materials that emit light, like screens or glowing objects.

### Advantages of PBR:

- **Consistency**: PBR provides a consistent appearance under various lighting conditions, making it easier for artists to predict how materials will look in different environments.
  
- **Realism**: By adhering to physical laws, PBR can achieve high levels of realism, making it a popular choice for video games, films, and architectural visualization.

- **Interoperability**: Materials designed with PBR in mind can be more easily shared between different projects and rendering engines, maintaining their appearance across different lighting conditions.

PBR has become a standard in the industry due to its ability to produce realistic and consistent results, contributing significantly to the visual fidelity of modern 3D graphics in games and films.